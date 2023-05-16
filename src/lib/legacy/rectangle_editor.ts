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
import type { Effect, EffectSettings, EffectType } from '$lib/effect';
import { RingSprite } from './sprites/circle_sprite';

export class RectangleEditor {
	private readonly ctx: CanvasRenderingContext2D;
	private readonly sprites: SpriteSystem;
	private readonly handlers = new Map<
		Sprite,
		(initialState: Rectangle) => (from: Point, to: Point, cursor: CanvasCursor) => Rectangle
	>();

	private readonly selectors = new Map<Sprite, string>();
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
		activeBlock: StateStore<Block>
	) {
		this.ctx = uiCanvas.getContext('2d')!;
		let updating = false;
		this.sprites = new SpriteSystem(
			mainCanvas,
			(sprite) => {
				const blockId = this.selectors.get(sprite);
				if (blockId) {
					return {
						move() {
							return;
						},
						drop() {
							activeBlock.set(activeFrame.value.blocks.find(({ id }) => blockId === id)!);
						}
					};
				}
				const effectHandler = this.effectsHandlers.get(sprite)?.();
				if (effectHandler)
					return {
						move: redrawWrapper((from, to, cursor) => {
							effectHandler(from, to, cursor);
							updating = true;
							activeBlock.set(activeBlock.value);
							updating = false;
						}),
						drop(from, to, cursor) {
							effectHandler(from, to, cursor);
							updating = true;
							activeBlock.set(activeBlock.value);
							updating = false;
						}
					};
				const activeContainer = activeBlock.value.container;
				if (!this.activeBlockId || activeContainer.type !== 'rectangle') return;
				const handler = this.handlers.get(sprite)?.(activeContainer.value);
				if (handler)
					return {
						move: redrawWrapper((from, to, cursor) => {
							activeContainer.value = handler(from, to, cursor);
							updating = true;
							activeBlock.set(activeBlock.value);
							updating = false;
						}),
						drop(from, to, cursor) {
							activeContainer.value = handler(from, to, cursor);
							updating = true;
							activeBlock.set(activeBlock.value);
							updating = false;
						}
					};
			},
			() => this.draw()
		);
		activeMeme.subscribe(() => {
			this.activeBlockId = '';
		});
		activeFrame.subscribe(() => {
			if (!updating) this.draw();
		});
		activeBlock.subscribe((activeBlock) => {
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
					s.forEach((s) => this.effectsHandlers.delete(s));
					s.forEach((s) => this.sprites.delete(s));
					this.effectToSprite.delete(e);
				}
				return;
			}

			this.activeBlockId = activeBlock.id;
			this.activeContainerType = activeBlock.container.type;
			this.setup(activeFrame.value.blocks, activeBlock);

			activeBlock.effects.forEach((effect) => this.setupEffect(effect));
		});
	}
	setupEffect(effect: Effect) {
		const uiUnit = 8 * this.cursor.scale;
		const e = effect.settings;
		function hasCircle(
			e: EffectSettings<EffectType>
		): e is EffectSettings<'bugle' | 'swirl' | 'pinch'> {
			return e.type === 'bugle' || e.type === 'swirl' || e.type === 'pinch';
		}
		if (!hasCircle(e)) return;
		const colorMap = {
			bugle: '#0fff00',
			pinch: '#ff00f0',
			swirl: '#0aaaa0'
		};
		this.addEffectModifier(
			new DragAndDropPolygon(
				createRectangle(uiUnit * 2, uiUnit * 2),
				new DynamicTransform(
					() => (hasCircle(effect.settings) ? effect.settings.center.x : -100),
					() => (hasCircle(effect.settings) ? effect.settings.center.y : -100),
					() => Math.PI / 4
				),
				true,
				alphaGradient(colorMap[e.type])
			),
			effect,
			() => (from: Point, to: Point) => {
				if (!hasCircle(effect.settings)) return false;
				effect.settings.center.x = to.x | 0;
				effect.settings.center.y = to.y | 0;
				return true;
			}
		);
		this.addEffectModifier(
			new RingSprite(e, uiUnit, true, alphaGradient(colorMap[e.type])),
			effect,
			() => (from: Point, to: Point) => {
				if (!hasCircle(effect.settings)) return false;
				const dx = to.x - effect.settings.center.x;
				const dy = to.y - effect.settings.center.y;
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
		this.selectors.clear();
		this.handlers.clear();
		this.sprites.clear();
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

		if (activeBlock.container.type !== 'rectangle') return;
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
		const uiUnit = 18 * this.cursor.scale;
		const array = arrowPolygon(uiUnit * 7, uiUnit * 1.4);
		const reverseOnCtrl = new DynamicTransform(
			() => 0,
			() => 0,
			() => (this.cursor.ctrl ? -r.transform.rotation() : 0),
			r.transform
		);
		const arrX = new DragAndDropPolygon(
			array,
			new Transform(0, 0, 0, reverseOnCtrl),
			true,
			alphaGradient('#0000ff')
		);
		const arrY = new DragAndDropPolygon(
			array,
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
		this.selectors.set(sprite, id);
	}
	private addModifier(
		sprite: Sprite,
		handler: (
			initialState: Rectangle
		) => (from: Point, to: Point, cursor: CanvasCursor) => Rectangle
	) {
		this.handlers.set(this.sprites.add(sprite), handler);
	}
	private readonly effectsHandlers = new Map<
		Sprite,
		() => (from: Point, to: Point, cursor: CanvasCursor) => boolean
	>();
	private readonly effectToSprite = new Map<Effect, Sprite[]>();
	private addEffectModifier(
		sprite: Sprite,
		effect: Effect,
		handler: () => (from: Point, to: Point, cursor: CanvasCursor) => boolean
	) {
		this.effectsHandlers.set(this.sprites.add(sprite), handler);
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
			if (cursor.shift) {
				lv = lh = Math.max(lv, lh);
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
