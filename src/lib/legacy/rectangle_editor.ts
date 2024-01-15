/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Point } from '../geometry/point';
import type { Rectangle } from '../geometry/rectangle';
import type { CanvasCursor } from './cursor';
import { type Sprite, SpriteSystem } from './sprites/sprite_system';
import type { Block, Frame, Meme } from '../meme';
import type { StateStore } from '../state';
import * as PointUtils from './geometry/point_utils';
import { Matrix } from './geometry/matrix';

import {
	arrowPolygon,
	DynamicTransform,
	DragAndDropPolygon,
	Transform,
	createRectangle,
	circleArrowPolygon,
	DragAndDropCalculatedPolygon
} from './sprites/sprite';
import type { Effect } from '$lib/effect';
import { RingSprite } from './sprites/circle_sprite';
import type { RawShader, ShaderInputDesc } from '$lib/graphics/shader';
import type { ImageContent } from '$lib/image';

export enum BlockEditorMode {
	Cursor,
	Move,
	Crop
}

type Handlers =
	| {
			type: 'move';
			handler: (
				initialState: Rectangle
			) => (from: Point, to: Point, cursor: CanvasCursor) => Rectangle;
	  }
	| {
			type: 'select';
			blockId: string;
	  }
	| {
			type: 'effect';
			handler: () => (from: Point, to: Point, cursor: CanvasCursor) => boolean;
	  }
	| {
			type: 'crop';
			handler: (
				initialTex: Rectangle,
				initialPos: Rectangle
			) => (from: Point, to: Point, cursor: CanvasCursor) => { tex: Rectangle; pos: Rectangle };
	  };

export interface BlockEditorState {
	mode: BlockEditorMode;
	available: BlockEditorMode[];
}

export class RectangleEditor {
	private readonly ctx: CanvasRenderingContext2D;
	private readonly sprites: SpriteSystem;
	private readonly handlers = new Map<Sprite, Handlers>();
	private readonly effectToSprite = new Map<Effect, Sprite[]>();
	private activeBlockId = '';
	private activeContainerType = '';
	private get cursor() {
		return this.sprites.cursor;
	}
	constructor(
		uiCanvas: HTMLCanvasElement,
		mainCanvas: HTMLCanvasElement,
		activeMeme: StateStore<Meme>,
		activeFrame: StateStore<Frame>,
		activeBlock: StateStore<Block>,
		readonly state: StateStore<BlockEditorState>,
		private readonly effectsShaders: Record<string, RawShader>
	) {
		this.ctx = uiCanvas.getContext('2d')!;
		let updating = false;
		this.sprites = new SpriteSystem(
			mainCanvas,
			(sprite) => {
				const handlerDesc = this.handlers.get(sprite);
				if (!handlerDesc) return;
				if (handlerDesc.type === 'select') {
					const blockId = handlerDesc.blockId;
					return {
						move() {
							return;
						},
						drop() {
							activeBlock.set(activeFrame.value.blocks.find(({ id }) => blockId === id)!);
						}
					};
				}
				if (handlerDesc.type === 'effect') {
					const effectHandler = handlerDesc.handler();
					const h = (from: Point, to: Point, cursor: CanvasCursor) => {
						effectHandler(from, to, cursor);
						updating = true;
						activeBlock.set(activeBlock.value);
						updating = false;
					};
					return {
						move: redrawWrapper(h),
						drop: h
					};
				}
				if (handlerDesc.type === 'move') {
					const activeContainer = activeBlock.value.container;
					if (!this.activeBlockId || activeContainer.type !== 'rectangle') return;
					const oldRect = activeContainer.value;
					const handler = handlerDesc.handler(oldRect);
					const h = (from: Point, to: Point, cursor: CanvasCursor) => {
						activeContainer.value = handler(from, to, cursor);
						updating = true;
						activeBlock.set(activeBlock.value);
						updating = false;
					};
					return {
						move: redrawWrapper(h),
						drop: h
					};
				}
				if (!this.activeBlockId) return;
				if (handlerDesc.type === 'crop') {
					const activeContainer = activeBlock.value.container;
					const activeContent = activeBlock.value.content;
					if (
						!this.activeBlockId ||
						activeContainer.type !== 'rectangle' ||
						activeContent.type !== 'image'
					)
						return;
					const oldRect = activeContainer.value;
					const oldTexRect = activeContent.value.crop;
					const handler = handlerDesc.handler(oldTexRect, oldRect);
					const h = (from: Point, to: Point, cursor: CanvasCursor) => {
						const res = handler(from, to, cursor);
						activeContainer.value = res.pos;
						activeContent.value.crop = res.tex;
						updating = true;
						activeBlock.set(activeBlock.value);
						updating = false;
					};
					return {
						move: redrawWrapper(h),
						drop: h
					};
				}
			},
			() => this.draw()
		);
		activeMeme.subscribe(() => {
			this.activeBlockId = '';
		});
		activeFrame.subscribe(() => {
			if (!updating) this.draw();
		});
		const modesSettings = {
			global: {
				text: {
					available: [BlockEditorMode.Cursor],
					default: BlockEditorMode.Cursor
				},
				image: {
					// available: [BlockEditorMode.Cursor, BlockEditorMode.Crop],
					available: [BlockEditorMode.Cursor],
					default: BlockEditorMode.Cursor
				}
			},
			rectangle: {
				text: {
					available: [BlockEditorMode.Cursor, BlockEditorMode.Move],
					default: BlockEditorMode.Move
				},
				image: {
					available: [BlockEditorMode.Cursor, BlockEditorMode.Move, BlockEditorMode.Crop],
					default: BlockEditorMode.Move
				}
			}
		};
		let innerStateUpdating = false;
		activeBlock.subscribe((activeBlock) => {
			const modeSettings = modesSettings[activeBlock.container.type][activeBlock.content.type];
			if (this.state.value.available !== modeSettings.available) {
				innerStateUpdating = true;
				this.state.set({ available: modeSettings.available, mode: modeSettings.default });
				innerStateUpdating = false;
			}
			if (!updating) this.draw();
			if (
				activeBlock.id == this.activeBlockId &&
				activeBlock.container.type == this.activeContainerType
			) {
				const current = new Map(this.effectToSprite);
				activeBlock.effects.forEach((effect) => {
					if (current.has(effect)) {
						current.delete(effect);
						return;
					}
					this.setupEffect(effect);
				});
				for (const [e, s] of current) {
					s.forEach((s) => this.handlers.delete(s));
					s.forEach((s) => this.sprites.delete(s));
					this.effectToSprite.delete(e);
				}
				return;
			}

			this.activeBlockId = activeBlock.id;
			this.activeContainerType = activeBlock.container.type;
			this.setup(activeFrame.value.blocks, activeBlock);
		});
		state.subscribe(() => {
			if (innerStateUpdating) return;
			this.setup(activeFrame.value.blocks, activeBlock.value);
			this.draw();
		});
	}
	setupEffect(effect: Effect) {
		const uiUnit = 8 * this.cursor.scale;
		const shader = this.effectsShaders[effect.type];
		if (!shader || !shader.inputs) return;
		let center: ShaderInputDesc | undefined;
		const points: ShaderInputDesc[] = [];
		let radius: ShaderInputDesc | undefined;
		for (const uniform of shader.inputs) {
			if (uniform.input.type == 'point') {
				points.push(uniform);
				if (uniform.name == 'center') center = uniform;
			} else if (uniform.name == 'radius' && uniform.input.type == 'float') radius = uniform;
		}
		const e = effect.settings;
		for (const point of points) {
			this.addEffectModifier(
				new DragAndDropPolygon(
					createRectangle(uiUnit * 2, uiUnit * 2),
					new DynamicTransform(
						() => (effect.settings[point.name] as Point).x,
						() => (effect.settings[point.name] as Point).y,
						() => Math.PI / 4
					),
					true,
					alphaGradient(point.input.type == 'point' ? point.input.color : '#000000')
				),
				effect,
				() => (from: Point, to: Point) => {
					(effect.settings[point.name] as Point).x = to.x | 0;
					(effect.settings[point.name] as Point).y = to.y | 0;
					return true;
				}
			);
		}
		if (!(center && radius)) return;
		this.addEffectModifier(
			new RingSprite(
				e as { center: Point; radius: number },
				uiUnit,
				true,
				alphaGradient(center.input.type == 'point' ? center.input.color : '#000000')
			),
			effect,
			() => (from: Point, to: Point) => {
				const dx = to.x - (effect.settings.center as Point).x;
				const dy = to.y - (effect.settings.center as Point).y;
				const dist = Math.sqrt(dx * dx + dy * dy);
				effect.settings.radius = dist | 0;
				return true;
			}
		);
	}
	draw = redrawWrapper(() => {
		const canvas = this.ctx.canvas;
		const sizes = this.cursor.realSize;
		if (canvas.width !== sizes.width) canvas.width = sizes.width;
		if (canvas.height !== sizes.height) canvas.height = sizes.height;
		this.ctx.clearRect(0, 0, canvas.width, canvas.height);
		this.ctx.save();
		this.ctx.scale(1 / this.cursor.scale, 1 / this.cursor.scale);
		this.sprites.draw(this.ctx);
		this.ctx.restore();
	});
	clear() {
		this.handlers.clear();
		this.sprites.clear();
	}
	setupBlock(activeBlock: Block) {
		if (this.state.value.mode === BlockEditorMode.Move) {
			if (activeBlock.container.type === 'rectangle') this.setupMoveRectangle(activeBlock);
			return;
		}
		if (this.state.value.mode === BlockEditorMode.Crop) {
			if (activeBlock.container.type === 'rectangle') this.setupCropRectangle(activeBlock);
			return;
		}
	}
	setup(blocks: Block[], activeBlock: Block) {
		const canvas = this.ctx.canvas;
		const sizes = this.cursor.realSize;
		if (canvas.width !== sizes.width) canvas.width = sizes.width;
		if (canvas.height !== sizes.height) canvas.height = sizes.height;
		this.clear();
		blocks.forEach((block) => {
			if (block === activeBlock || block.container.type !== 'rectangle') return;
			this.addSelector(block.id, block.container.value);
		});
		this.setupBlock(activeBlock);
		activeBlock.effects.forEach((effect) => this.setupEffect(effect));
	}
	private setupCropRectangle(activeBlock: Block) {
		const uiUnit = 8 * this.cursor.scale;
		const sprite = new DragAndDropCalculatedPolygon(
			() =>
				createRectangle(
					(activeBlock.container.value as Rectangle).width,
					(activeBlock.container.value as Rectangle).height
				),
			new DynamicTransform(
				() => (activeBlock.container.value as Rectangle).position.x,
				() => (activeBlock.container.value as Rectangle).position.y,
				() => (activeBlock.container.value as Rectangle).rotation
			),
			true,
			{ fill: {}, stroke: { default: '#aaaaaa ' } }
		);
		const r = this.sprites.add(sprite);
		const arrow = arrowPolygon(uiUnit * 7, uiUnit * 2);
		const texR = new DragAndDropPolygon(
			createRectangle(uiUnit * 2.5, uiUnit * 2.5),
			new DynamicTransform(
				() => 0,
				() => 0,
				() => -(activeBlock.content.value as ImageContent).crop.rotation,
				r.transform
			),
			true,
			alphaGradient('#a4b4c4')
		);
		const reverseOnCtrl = new DynamicTransform(
			() => 0,
			() => 0,
			() => (this.cursor.ctrl ? -texR.transform.rotation() : 0),
			texR.transform
		);
		const arrX = new DragAndDropPolygon(
			arrow,
			new Transform(0, 0, 0, reverseOnCtrl),
			true,
			alphaGradient('#4444aa')
		);
		const arrY = new DragAndDropPolygon(
			arrow,
			new Transform(0, 0, -Math.PI / 2, reverseOnCtrl),
			true,
			alphaGradient('#aa4444')
		);
		this.addCrop(arrX, moveCropAlong(arrX));
		this.addCrop(arrY, moveCropAlong(arrY));
		this.addCrop(texR, moveTexCoords);
		const arrRotate = new DragAndDropPolygon(
			circleArrowPolygon(4 * uiUnit, Math.PI * 1.5, uiUnit * 1.5),
			new Transform(0, 0, -Math.PI / 4, texR.transform),
			true,
			alphaGradient('#88ee88')
		);
		this.addCrop(arrRotate, rotationCrop(texR.transform));
		[
			{ dim: 'width' as const, dir: { x: 1, y: 0 } },
			{ dim: 'width' as const, dir: { x: -1, y: 0 } },
			{ dim: 'height' as const, dir: { x: 0, y: 1 } },
			{ dim: 'height' as const, dir: { x: 0, y: -1 } }
		].forEach(({ dim, dir }) => {
			const rectangle =
				dim === 'height'
					? () => createRectangle((activeBlock.container.value as Rectangle).width - uiUnit, uiUnit)
					: () =>
							createRectangle(uiUnit, (activeBlock.container.value as Rectangle).height - uiUnit);
			this.addCrop(
				new DragAndDropCalculatedPolygon(
					rectangle,
					new DynamicTransform(
						() => (dir.x * (activeBlock.container.value as Rectangle).width) / 2,
						() => (dir.y * (activeBlock.container.value as Rectangle).height) / 2,
						() => 0,
						r.transform
					),
					true,
					alphaGradient('#333333')
				),
				sideCropPatchByUI(dim, dir)
			);
		});
		[
			{ x: 1, y: 1 },
			{ x: -1, y: 1 },
			{ x: -1, y: -1 },
			{ x: 1, y: -1 }
		].forEach((dir) => {
			this.addCrop(
				new DragAndDropPolygon(
					createRectangle(uiUnit, uiUnit),
					new DynamicTransform(
						() => (dir.x * (activeBlock.container.value as Rectangle).width) / 2,
						() => (dir.y * (activeBlock.container.value as Rectangle).height) / 2,
						() => 0,
						r.transform
					),
					true,
					alphaGradient('#444444')
				),
				cropPatchByUI(dir)
			);
		});
	}
	private setupMoveRectangle(activeBlock: Block) {
		const sprite = new DragAndDropCalculatedPolygon(
			() =>
				createRectangle(
					(activeBlock.container.value as Rectangle).width,
					(activeBlock.container.value as Rectangle).height
				),
			new DynamicTransform(
				() => (activeBlock.container.value as Rectangle).position.x,
				() => (activeBlock.container.value as Rectangle).position.y,
				() => (activeBlock.container.value as Rectangle).rotation
			),
			true,
			{ fill: {}, stroke: { default: '#aaaa00 ' } }
		);
		const r = this.sprites.add(sprite);
		const uiUnit = 16 * this.cursor.scale;
		const arrow = arrowPolygon(uiUnit * 7, uiUnit * 1.4);
		const reverseOnCtrl = new DynamicTransform(
			() => 0,
			() => 0,
			() => (this.cursor.ctrl ? -r.transform.rotation() : 0),
			r.transform
		);
		const arrX = new DragAndDropPolygon(
			arrow,
			new Transform(0, 0, 0, reverseOnCtrl),
			true,
			alphaGradient('#0000ff')
		);
		const arrY = new DragAndDropPolygon(
			arrow,
			new Transform(0, 0, -Math.PI / 2, reverseOnCtrl),
			true,
			alphaGradient('#ff0000')
		);
		this.addModifier(arrX, moveAlong(arrX));
		this.addModifier(arrY, moveAlong(arrY));
		this.addModifier(
			new DragAndDropPolygon(
				createRectangle(uiUnit * 2, uiUnit * 2),
				new Transform(0, 0, 0, r.transform),
				true,
				alphaGradient('#ff00ff')
			),
			(box: Rectangle) => (from: Point, to: Point) => {
				const dx = to.x - from.x;
				const dy = to.y - from.y;
				const { x, y } = box.position;
				return {
					...box,
					position: {
						x: (x + dx) | 0,
						y: (y + dy) | 0
					}
				};
			}
		);
		const arrRotate = new DragAndDropPolygon(
			circleArrowPolygon(4 * uiUnit, Math.PI * 1.5, uiUnit * 1.5),
			new Transform(0, 0, -Math.PI / 4, r.transform),
			true,
			alphaGradient('#00ff00')
		);
		this.addModifier(arrRotate, rotation);
		[
			{ dim: 'width' as const, dir: { x: 1, y: 0 } },
			{ dim: 'width' as const, dir: { x: -1, y: 0 } },
			{ dim: 'height' as const, dir: { x: 0, y: 1 } },
			{ dim: 'height' as const, dir: { x: 0, y: -1 } }
		].forEach(({ dim, dir }) => {
			const rectangle =
				dim === 'height'
					? () => createRectangle((activeBlock.container.value as Rectangle).width - uiUnit, uiUnit)
					: () =>
							createRectangle(uiUnit, (activeBlock.container.value as Rectangle).height - uiUnit);
			this.addModifier(
				new DragAndDropCalculatedPolygon(
					rectangle,
					new DynamicTransform(
						() => (dir.x * (activeBlock.container.value as Rectangle).width) / 2,
						() => (dir.y * (activeBlock.container.value as Rectangle).height) / 2,
						() => 0,
						r.transform
					),
					true,
					alphaGradient('#ff9900')
				),
				sideResizePatchByUI(dim, dir)
			);
		});
		[
			{ x: 1, y: 1 },
			{ x: -1, y: 1 },
			{ x: -1, y: -1 },
			{ x: 1, y: -1 }
		].forEach((dir) => {
			this.addModifier(
				new DragAndDropPolygon(
					createRectangle(uiUnit, uiUnit),
					new DynamicTransform(
						() => (dir.x * (activeBlock.container.value as Rectangle).width) / 2,
						() => (dir.y * (activeBlock.container.value as Rectangle).height) / 2,
						() => 0,
						r.transform
					),
					true,
					alphaGradient('#ff99ff')
				),
				resizePatchByUI(dir)
			);
		});
	}

	private addSelector(id: string, container: Rectangle) {
		const sprite = this.sprites.add(
			new DragAndDropPolygon(
				createRectangle(container.width, container.height),
				new Transform(container.position.x, container.position.y, container.rotation),
				true,
				{
					fill: {
						hover: `#aaaaaa22`,
						active: `#aaaaaa44`
					},
					stroke: {
						hover: `#aaaaaa99`,
						active: `#aaaaaa`
					}
				}
			)
		);
		this.handlers.set(sprite, { type: 'select', blockId: id });
	}
	private addModifier(
		sprite: Sprite,
		handler: (
			initialState: Rectangle
		) => (from: Point, to: Point, cursor: CanvasCursor) => Rectangle
	) {
		this.handlers.set(this.sprites.add(sprite), { type: 'move', handler });
	}
	private addCrop(
		sprite: Sprite,
		handler: (
			initialTex: Rectangle,
			initialPos: Rectangle
		) => (from: Point, to: Point, cursor: CanvasCursor) => { tex: Rectangle; pos: Rectangle }
	) {
		this.handlers.set(this.sprites.add(sprite), { type: 'crop', handler });
	}
	private addEffectModifier(
		sprite: Sprite,
		effect: Effect,
		handler: () => (from: Point, to: Point, cursor: CanvasCursor) => boolean
	) {
		this.handlers.set(this.sprites.add(sprite), { type: 'effect', handler });
		if (this.effectToSprite.has(effect)) this.effectToSprite.get(effect)!.push(sprite);
		else this.effectToSprite.set(effect, [sprite]);
	}
}

function rotation(
	original: Rectangle
): (from: Point, to: Point, cursor: CanvasCursor) => Rectangle {
	const { rotation } = original;
	const center = original.position;
	return (from: Point, to: Point, cursor: CanvasCursor) => {
		const v1 = PointUtils.vector(center, from);
		const v2 = PointUtils.vector(center, to);
		const a1 = Math.atan2(v1.y, v1.x);
		const a2 = Math.atan2(v2.y, v2.x);
		const delta = (Math.PI / 180) * 1;
		let dRotate = Math.round((a2 - a1) / delta) * delta;
		const step = Math.PI / 4;
		if (cursor.shift) dRotate = ((dRotate / step) | 0) * step;
		return {
			...original,
			rotation: cursor.ctrl ? dRotate : rotation + dRotate
		};
	};
}

function alphaGradient(color: string) {
	return {
		fill: {
			default: `${color}44`,
			hover: `${color}99`,
			active: `${color}`
		},
		stroke: {
			default: `${color}44`,
			hover: `${color}99`,
			active: `${color}`
		}
	};
}

function sideResizePatchByUI(side: 'width' | 'height', dir: Point) {
	return (origin: Rectangle) => {
		return (from: Point, to: Point, cursor: CanvasCursor): Rectangle => {
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const v = Matrix.Rotation(origin.rotation).Transform(dir);
			let l = (dx * v.x + dy * v.y) | 0;
			if (cursor.shift) l = ((l / 10) | 0) * 10;
			if (!cursor.ctrl) return { ...origin, [side]: origin[side] + 2 * l };
			return {
				...origin,
				position: { x: origin.position.x + (v.x * l) / 2, y: origin.position.y + (v.y * l) / 2 },
				[side]: origin[side] + l
			};
		};
	};
}
function resizePatchByUI(dir: Point) {
	return (origin: Rectangle) => {
		return (from: Point, to: Point, cursor: CanvasCursor): Rectangle => {
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const vv = Matrix.Rotation(origin.rotation).Transform({ x: 0, y: dir.y });
			const vh = Matrix.Rotation(origin.rotation).Transform({ x: dir.x, y: 0 });
			let lv = (dx * vv.x + dy * vv.y) | 0;
			let lh = (dx * vh.x + dy * vh.y) | 0;
			const ratio = origin.width / origin.height;
			if (cursor.shift) {
				lh = Math.max(lv * ratio, lh);
				lv = lh / ratio;
			}
			if (!cursor.ctrl)
				return { ...origin, height: origin.height + 2 * lv, width: origin.width + 2 * lh };
			return {
				...origin,
				position: {
					x: origin.position.x + (vv.x * lv) / 2 + (vh.x * lh) / 2,
					y: origin.position.y + (vv.y * lv) / 2 + (vh.y * lh) / 2
				},
				height: origin.height + lv,
				width: origin.width + lh
			};
		};
	};
}

function moveAlong(arrow: DragAndDropPolygon) {
	return (original: Rectangle) => {
		return (from: Point, to: Point, cursor: CanvasCursor): Rectangle => {
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const { x, y } = original.position;
			const v = Matrix.Rotation(arrow.transform.rotation()).Transform({ x: 1, y: 0 });
			let l = dx * v.x + dy * v.y;
			if (cursor.shift) l = ((l / 10) | 0) * 10;
			return { ...original, position: { x: x + v.x * l, y: y + v.y * l } };
		};
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function redrawWrapper<T extends (...args: any) => void>(draw: T) {
	let frameIndex = 0;
	return (...args: Parameters<T>) => {
		if (frameIndex) {
			return;
			// cancelAnimationFrame(frameIndex);
		}
		frameIndex = requestAnimationFrame(() => {
			frameIndex = 0;
			// eslint-disable-next-line prefer-spread
			draw.apply(undefined, args);
		});
	};
}

function sideCropPatchByUI(side: 'width' | 'height', dir: Point) {
	return (texOrigin: Rectangle, posOrigin: Rectangle) => {
		return (from: Point, to: Point, cursor: CanvasCursor): { tex: Rectangle; pos: Rectangle } => {
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const rv = Matrix.Rotation(posOrigin.rotation).Transform(dir);
			let realDelta = dx * rv.x + dy * rv.y;
			if (cursor.shift) realDelta = ((realDelta / 10) | 0) * 10;
			const sx = texOrigin.width / posOrigin.width;
			const sy = texOrigin.height / posOrigin.height;
			const tdir = { x: dir.x * realDelta, y: dir.y * realDelta };
			const texDelta =
				Math.sign(texOrigin[side]) *
				Math.sign(posOrigin[side]) *
				Math.sign(realDelta) *
				Math.sqrt(tdir.x * tdir.x * sx * sx + tdir.y * tdir.y * sy * sy);

			if (!cursor.ctrl)
				return {
					tex: { ...texOrigin, [side]: texOrigin[side] + 2 * texDelta },
					pos: { ...posOrigin, [side]: posOrigin[side] + 2 * realDelta }
				};

			const tv = Matrix.Rotation(texOrigin.rotation).Transform(tdir);
			return {
				tex: {
					...texOrigin,
					position: {
						x: texOrigin.position.x + (tv.x / 2) * sx,
						y: texOrigin.position.y + (tv.y / 2) * sy
					},
					[side]: texOrigin[side] + texDelta
				},
				pos: {
					...posOrigin,
					position: {
						x: posOrigin.position.x + (rv.x * realDelta) / 2,
						y: posOrigin.position.y + (rv.y * realDelta) / 2
					},
					[side]: posOrigin[side] + realDelta
				}
			};
		};
	};
}

function cropPatchByUI(dir: Point) {
	return (texOrigin: Rectangle, posOrigin: Rectangle) => {
		return (from: Point, to: Point, cursor: CanvasCursor): { tex: Rectangle; pos: Rectangle } => {
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const posRotation = Matrix.Rotation(posOrigin.rotation);
			const vh = posRotation.Transform({ x: 0, y: dir.y });
			const vw = posRotation.Transform({ x: dir.x, y: 0 });
			let lh = (dx * vh.x + dy * vh.y) | 0;
			let lw = (dx * vw.x + dy * vw.y) | 0;
			const ratio = posOrigin.height / posOrigin.width;
			if (cursor.shift) {
				lh = Math.max(lw * ratio, lh);
				lw = lh / ratio;
			}
			const sx = texOrigin.width / posOrigin.width;
			const sy = texOrigin.height / posOrigin.height;

			const tlh = lh * sy;
			const tlw = lw * sx;

			if (!cursor.ctrl)
				return {
					tex: {
						...texOrigin,
						width: texOrigin.width + 2 * tlw,
						height: texOrigin.height + 2 * tlh
					},
					pos: { ...posOrigin, height: posOrigin.height + 2 * lh, width: posOrigin.width + 2 * lw }
				};

			const texRotation = Matrix.Rotation(texOrigin.rotation);
			const tvh = texRotation.Transform({ x: Math.sign(dir.x) * lw, y: Math.sign(dir.y) * lh });
			return {
				tex: {
					...texOrigin,
					position: {
						x: texOrigin.position.x + (tvh.x / 2) * sx,
						y: texOrigin.position.y + (tvh.y / 2) * sy
					},
					width: texOrigin.width + tlw,
					height: texOrigin.height + tlh
				},
				pos: {
					...posOrigin,
					position: {
						x: posOrigin.position.x + (vh.x * lh) / 2 + (vw.x * lw) / 2,
						y: posOrigin.position.y + (vh.y * lh) / 2 + (vw.y * lw) / 2
					},
					width: posOrigin.width + lw,
					height: posOrigin.height + lh
				}
			};
		};
	};
}

function moveTexCoords(
	texOrigin: Rectangle,
	posOrigin: Rectangle
): (from: Point, to: Point, cursor: CanvasCursor) => { tex: Rectangle; pos: Rectangle } {
	return (from: Point, to: Point) => {
		const dx = to.x - from.x;
		const dy = to.y - from.y;
		const sx = texOrigin.width / posOrigin.width;
		const sy = texOrigin.height / posOrigin.height;
		const rv = Matrix.Rotation(texOrigin.rotation - posOrigin.rotation).Transform({ x: dx, y: dy });
		return {
			tex: {
				...texOrigin,
				position: {
					x: texOrigin.position.x - rv.x * sx,
					y: texOrigin.position.y - rv.y * sy
				}
			},
			pos: posOrigin
		};
	};
}

function moveCropAlong(arrow: DragAndDropPolygon) {
	return (texOrigin: Rectangle, posOrigin: Rectangle) => {
		return (from: Point, to: Point, cursor: CanvasCursor): { tex: Rectangle; pos: Rectangle } => {
			const dx = to.x - from.x;
			const dy = to.y - from.y;
			const v = Matrix.Rotation(arrow.transform.rotation()).Transform({ x: 1, y: 0 });
			let l = dx * v.x + dy * v.y;
			if (cursor.shift) l = ((l / 10) | 0) * 10;
			const sx = texOrigin.width / posOrigin.width;
			const sy = texOrigin.height / posOrigin.height;
			const rv = Matrix.Rotation(texOrigin.rotation - posOrigin.rotation).Transform({
				x: v.x * l,
				y: v.y * l
			});
			const { x, y } = texOrigin.position;
			return {
				tex: { ...texOrigin, position: { x: x - rv.x * sx, y: y - rv.y * sy } },
				pos: posOrigin
			};
		};
	};
}

function rotationCrop(
	centerTransform: Transform
): (
	texOrigin: Rectangle,
	posOrigin: Rectangle
) => (from: Point, to: Point, cursor: CanvasCursor) => { tex: Rectangle; pos: Rectangle } {
	return (texOrigin: Rectangle, posOrigin: Rectangle) => {
		const { rotation } = texOrigin;
		const center = centerTransform.matrix().Transform({ x: 0, y: 0 });
		return (from: Point, to: Point, cursor: CanvasCursor) => {
			const v1 = PointUtils.vector(center, from);
			const v2 = PointUtils.vector(center, to);
			const a1 = Math.atan2(v1.y, v1.x);
			const a2 = Math.atan2(v2.y, v2.x);
			const delta = (Math.PI / 180) * 1;
			let dRotate = -Math.round((a2 - a1) / delta) * delta;
			const step = Math.PI / 4;
			if (cursor.shift) dRotate = ((dRotate / step) | 0) * step;
			return {
				tex: {
					...texOrigin,
					rotation: cursor.ctrl ? dRotate : rotation + dRotate
				},
				pos: posOrigin
			};
		};
	};
}
