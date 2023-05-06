import JSZip from 'jszip';
import { tick } from 'svelte';
import type { Writable } from 'svelte/store';
import { TextureManager, type Texture } from './graphics/textures';
import { IdGenerator } from './id_generator';
import { patternsNames } from '$lib/material/pattern/store';
import { FrameDrawer, type Meme, type Frame, type Block } from './meme';
import { MemeFormat } from './meme_format';
import { type StateStore, deepCopy } from './state';
import { forceLoadFonts } from './text/fonts_store';
import { defaultStyle } from './text/presets';
import { useBlobUrl } from './utils';

type TextureMeta = {
	type: 'pattern' | 'image';
	source: 'default' | 'user';
};
export interface FileImport {
	readonly name: string;
	readonly url: string;
}
export type Skin = Record<'empty' | 'await', FileImport[]>;
export type SkinsMap = Record<string, Skin>;

export function isSkin(raw: Record<string, FileImport[]>): raw is Skin {
	const keys = new Set(Object.keys(raw));
	return ['empty', 'await'].every((key) => keys.has(key));
}

export function isSkinsMap(raw: Record<string, Record<string, FileImport[]>>): raw is SkinsMap {
	return Object.values(raw).every(isSkin);
}

export class Memaker {
	private textures: TextureManager<TextureMeta>;
	private drawer: FrameDrawer;
	public meme: Meme = { frames: [] };
	public activeFrame!: Frame;
	public activeBlock!: Block;
	private inUpdate = { meme: false, frame: false, block: false };
	public get busy(): boolean {
		return this.backgroundTasks.size != 0;
	}
	public get currentTask(): string {
		if (!this.busy) return '';
		return this.backgroundTasks.values().next().value;
	}
	private backgroundTasks: Map<Promise<unknown>, string> = new Map();
	private runTask<T>(description: string, task: Promise<T>): Promise<T> {
		this.backgroundTasks.set(task, description);
		this.stores.busy.set(this.currentTask);
		task.finally(() => {
			this.backgroundTasks.delete(task);
			this.stores.busy.set(this.currentTask);
		});
		return task;
	}
	private placeholdersTextures = new Array<Texture>();
	// texture.id => block[]
	private usedImages = new Map<string, Set<Block>>();
	private addImageUsage(block: Block) {
		if (block.content.type != 'image') return;
		const textureId = block.content.value.id;
		const texture = this.textures.get(textureId);
		if (texture.meta.source == 'default') return;
		let blocks = this.usedImages.get(textureId);
		if (!blocks) {
			this.usedImages.set(textureId, (blocks = new Set()));
		}
		blocks.add(block);
	}
	private removeImageUsage(block: Block) {
		if (block.content.type != 'image') return;
		const textureId = block.content.value.id;
		const texture = this.textures.get(textureId);
		if (texture.meta.source == 'default') return;
		const blocks = this.usedImages.get(textureId);
		if (!blocks) {
			return;
		}
		blocks.delete(block);
		if (blocks.size == 0) this.textures.delete(textureId);
	}
	readonly gl: WebGL2RenderingContext;
	constructor(
		readonly stores: {
			meme: StateStore<Meme>;
			frame: StateStore<Frame>;
			block: StateStore<Block>;
			previews: StateStore<Record<string, (canvas: HTMLCanvasElement) => void>>;
			busy: Writable<string>;
		},
		canvas: HTMLCanvasElement,
		defaultPatterns: { name: string; url: string }[],
		placeholdersUrls: SkinsMap,
		skinKey: string
	) {
		const gl = canvas.getContext('webgl2', { premultipliedAlpha: false });
		if (!gl) throw new Error('Failed to create WebGL2 context!');
		this.gl = gl;
		this.textures = new TextureManager(gl);
		this.drawer = new FrameDrawer(gl, this.textures);
		this.runTask(
			'Загрузка ресурсов',
			Promise.all(
				defaultPatterns.map(({ name, url }) =>
					this.textures
						.downloadImage(url, {
							id: name,
							wrap: gl.REPEAT,
							meta: { source: 'default', type: 'pattern' }
						})
						.then((tex) => [name, tex] as const)
				)
			)
				.then((entries) =>
					entries.map(([filename, tex]) => ({ name: filename, textureId: tex.id }))
				)
				.then((patternTextures) => patternsNames.addPattern(...patternTextures))
		);
		this.runTask('Загрузка шрифтов', forceLoadFonts());
		this.runTask(
			'Загрузка плейсхолдеров',
			Promise.all(
				Object.entries(placeholdersUrls).map(([key, { empty }]) =>
					Promise.all(
						empty.map(({ name, url }) =>
							this.textures.downloadImage(url, {
								id: `placeholder-${key}-${name}`,
								meta: { source: 'default', type: 'image' }
							})
						)
					).then((textures) => [key, textures] as const)
				)
			)
				.then(Object.fromEntries)
				.then((x) => (this.placeholdersTextures = x[skinKey] ?? x['default']))
				.then(() => this.deleteFrame(this.activeFrame))
				.then(() => this.draw(this.activeFrame, true))
		);
		const redraw = redrawWrapper(() => this.draw());
		stores.meme.subscribe((value) => {
			if (this.inUpdate.meme) return;
			this.meme = value;
		});
		stores.frame.subscribe((value) => {
			redraw();
			if (this.inUpdate.frame) return;
			this.activeFrame = value;
		});
		stores.block.subscribe((value) => {
			redraw();
			if (this.inUpdate.block) return;
			this.activeBlock = value;
		});
	}
	protected memeUpdated() {
		this.inUpdate.meme = true;
		this.stores.meme.set(this.meme);
		this.inUpdate.meme = false;
	}
	protected frameUpdated() {
		this.inUpdate.frame = true;
		this.stores.frame.set(this.activeFrame);
		this.inUpdate.frame = false;
	}
	protected blockUpdated() {
		this.inUpdate.block = true;
		this.stores.block.set(this.activeBlock);
		this.inUpdate.block = false;
	}
	shiftBlock(block: Block, dir: -1 | 1) {
		const blocks = this.activeFrame.blocks;
		const curIndex = blocks.indexOf(block);
		let nextIndex = -1;
		const blockCount = blocks.length;
		for (let i = curIndex + dir; i > 0 && i < blockCount; i += dir) {
			if (blocks[i].content.type != 'text') continue;
			nextIndex = i;
			break;
		}
		if (nextIndex == -1) return;
		blocks[curIndex] = blocks[nextIndex];
		blocks[nextIndex] = block;
		this.frameUpdated();
	}
	shiftFrame(block: Frame, dir: -1 | 1) {
		const frames = this.meme.frames;
		const curIndex = frames.indexOf(block);
		const nextIndex = curIndex + dir;
		if (nextIndex < 0 || nextIndex >= frames.length) return;
		frames[curIndex] = frames[nextIndex];
		frames[nextIndex] = block;
		this.memeUpdated();
	}
	blockIdGenerator = new IdGenerator('v.0.2.0-' + Date.now().toString() + '-');
	addBlock(newBlock = this.activeBlock) {
		newBlock = deepCopy(newBlock);
		newBlock.id = this.blockIdGenerator.generate();
		if (newBlock.content.type === 'text') {
			newBlock.content.value.text = 'Текст';
			if (newBlock.container.type === 'global') {
				newBlock.content.value.style.baseline = 'middle';
				newBlock.content.value.style.align = 'center';
			}
		}
		const frame = this.activeFrame;
		newBlock.container = {
			type: 'rectangle',
			value: {
				width: (frame.width * 0.5) | 0,
				height: (frame.height * 0.5) | 0,
				position: {
					x: (frame.width * 0.5) | 0,
					y: (frame.height * 0.5) | 0
				},
				rotation: 0
			}
		};
		this.activeFrame.blocks.push(newBlock);
		this.activeBlock = newBlock;
		this.frameUpdated();
		this.blockUpdated();
	}
	newFrame(background: Texture): Frame {
		const textStyle = {
			...deepCopy(
				this.activeBlock?.content?.type === 'text'
					? this.activeBlock.content.value.style
					: defaultStyle
			),
			baseline: 'bottom' as const
		};
		return {
			id: this.blockIdGenerator.generate(),
			blocks: [
				{
					id: this.blockIdGenerator.generate(),
					container: {
						type: 'global',
						value: {
							maxHeight: 1,
							maxWidth: 1,
							minHeight: 1
						}
					},
					content: {
						type: 'image',
						value: {
							id: background.id
						}
					}
				},
				{
					id: this.blockIdGenerator.generate(),
					container: {
						type: 'global',
						value: {
							maxWidth: 0.96,
							maxHeight: 0.4,
							minHeight: 0
						}
					},
					content: {
						type: 'text',
						value: {
							text: '',
							style: textStyle
						}
					}
				}
			],
			height: background.height,
			width: background.width
		};
	}
	copyFrame(frame: Frame) {
		const copy = deepCopy(frame);
		copy.id = this.blockIdGenerator.generate();
		frame.blocks.forEach((block) => (block.id = this.blockIdGenerator.generate()));
		return copy;
	}
	addFrame(origin?: Frame) {
		const frame: Frame = origin
			? this.copyFrame(origin)
			: this.newFrame(
					this.placeholdersTextures[Math.floor(Math.random() * this.placeholdersTextures.length)]
			  );
		this.meme.frames.push(frame);
		this.activeFrame = frame;
		frame.blocks.forEach((b) => this.addImageUsage(b));
		this.memeUpdated();
		this.frameUpdated();
		return frame;
	}
	deleteBlock(block: Block) {
		if (block.id == this.activeBlock.id) {
			const nextForSelection = this.activeFrame.blocks.find(
				(b) => b.id != block.id && b.content.type === 'text'
			);
			if (nextForSelection) {
				this.activeBlock = nextForSelection;
				this.blockUpdated();
			} else {
				this.addBlock();
			}
		}
		this.removeImageUsage(block);
		this.activeFrame.blocks.splice(this.activeFrame.blocks.indexOf(block), 1);
		this.frameUpdated();
	}
	deleteFrame(frame: Frame) {
		if (frame.id == this.activeFrame.id) {
			const nextForSelection = this.meme.frames.find((b) => b.id != frame.id);
			if (nextForSelection) {
				this.activeFrame = nextForSelection;
				this.frameUpdated();
			} else {
				this.addFrame();
			}
		}
		this.meme.frames.splice(this.meme.frames.indexOf(frame), 1);
		frame.blocks.forEach((b) => this.removeImageUsage(b));
		this.memeUpdated();
	}
	setBackground = (file: File) => {
		const reader = new FileReader();
		const promise = new Promise<string>((resolve, reject) => {
			reader.addEventListener('load', () => resolve(reader.result as string));
			reader.addEventListener('error', () => reject(reader.error));
		});
		reader.readAsDataURL(file);
		this.runTask(
			'Меняем фон',
			promise.then((url) =>
				this.textures
					.downloadImage(url, { meta: { source: 'user', type: 'image' } })
					.then((texture) => {
						this.removeImageUsage(this.activeFrame.blocks[0]);
						this.activeFrame.blocks[0].content = { type: 'image', value: { id: texture.id } };
						this.activeFrame.width = texture.width;
						this.activeFrame.height = texture.height;
						this.addImageUsage(this.activeFrame.blocks[0]);
						this.frameUpdated();
					})
			)
		);
	};

	copyFrameToClipboard(): Promise<void> {
		return this.runTask(
			'Копируем',
			this.frameBlob(this.activeFrame).then((blob) => {
				window.navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
			})
		);
	}

	private frameBlob(frame: Frame): Promise<Blob> {
		this.drawer.drawFrame(frame);
		return canvasToBlob(this.gl.canvas as HTMLCanvasElement);
	}
	drawPreview(frame: Frame) {
		this.stores.previews.value[frame.id]?.(this.gl.canvas as HTMLCanvasElement);
	}
	drawPreviewAsync = timeoutWrapper((frame) => {
		this.drawer.drawFrame(frame);
		this.drawPreview(frame);
	}, 250);
	draw(frame = this.activeFrame, force = false) {
		if (this.busy && !force) return;
		this.drawer.drawFrame(frame);
		if (force) this.drawPreview(frame);
		else this.drawPreviewAsync(frame);
	}
	renderMeme(): Promise<{ ext: string; blob: Blob }> {
		return this.runTask(
			'Пакуем мем',
			Promise.all(this.meme.frames.map((frame) => this.frameBlob(frame))).then((blobs) => {
				this.drawer.drawFrame(this.activeFrame);
				if (blobs.length == 1) return { ext: 'png', blob: blobs[0] };
				const zip = new JSZip();
				const maxDigitsCount = blobs.length.toString().length;
				blobs.forEach((blob, index) => {
					zip.file(`${(index + 1).toString().padStart(maxDigitsCount, '0')}.png`, blob, {
						binary: true
					});
				});
				return zip.generateAsync({ type: 'blob' }).then((blob) => ({ ext: 'zip', blob }));
			})
		);
	}
	getImagesList(meme: Meme = this.meme) {
		return Array.from(
			new Set(
				meme.frames.flatMap((frame) =>
					frame.blocks
						.map((b) => b.content)
						.map((c) => (c.type == 'image' ? this.textures.get(c.value.id) : ''))
						.filter(
							((b) => b && b.meta.source == 'user' && b.meta.type == 'image') as (
								b: Texture<TextureMeta> | ''
							) => b is Texture<TextureMeta>
						)
				)
			)
		);
	}
	private zipCanvas = document.createElement('canvas');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	private zipCtx = this.zipCanvas.getContext('2d')!;
	exportMeme(): Promise<Blob> {
		const images = this.getImagesList();

		return this.runTask(
			'Пакуем мем',
			Promise.all(
				images.map((texture) => {
					this.zipCanvas.width = texture.width;
					this.zipCanvas.height = texture.height;
					this.zipCtx.drawImage(texture.original, 0, 0);
					return canvasToBlob(this.zipCanvas).then((blob) => ({ id: texture.id, blob }));
				})
			).then((images) => MemeFormat.toFile({ meme: this.meme, resources: { images } }))
		);
	}
	openMeme(file: Blob) {
		return this.runTask(
			'Распаковываем мем',
			MemeFormat.fromFile(file).then((memeData) => {
				// clean current meme
				this.getImagesList().forEach((tex) => this.textures.delete(tex.id));
				this.usedImages.clear();
				return Promise.all(
					memeData.resources.images.map(({ id, blob }) =>
						useBlobUrl(blob, (url) =>
							this.textures.downloadImage(url, {
								id,
								meta: { source: 'user', type: 'image' }
							})
						)
					)
				)
					.then(() => {
						this.meme = memeData.meme;
						this.meme.frames
							.flatMap((frame) => frame.blocks)
							.forEach((block) => this.addImageUsage(block));
						this.activeFrame = this.meme.frames[0];
						this.memeUpdated();
						this.frameUpdated();
						return tick();
					})
					.then(() => {
						this.meme.frames.forEach((frame) => this.draw(frame, true));
						this.draw();
					});
			})
		);
	}
	framesFromImages(files: File[]) {
		return this.runTask(
			'Загружаем картинки',
			Promise.all(
				files.map((file) =>
					useBlobUrl(file, (url) =>
						this.textures.downloadImage(url, { meta: { source: 'user', type: 'image' } })
					)
				)
			)
				.then((textures) => textures.map((texture) => this.addFrame(this.newFrame(texture))))
				.then((frames) => {
					return tick().then(() => frames);
				})
				.then((frames) => {
					frames.forEach((frame) => this.draw(frame, true));
				})
		);
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function redrawWrapper<Args extends any[]>(draw: (...v: Args) => void) {
	let frameIndex = 0;
	return (...args: Args) => {
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timeoutWrapper<Args extends any[]>(draw: (...v: Args) => void, delay: number) {
	let frameIndex = 0;
	return (...args: Args) => {
		if (frameIndex) {
			clearTimeout(frameIndex);
		}
		frameIndex = setTimeout(() => {
			frameIndex = 0;
			// eslint-disable-next-line prefer-spread
			draw.apply(undefined, args);
		}, delay) as unknown as number;
	};
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise((resolve, error) =>
		canvas.toBlob((blob) => {
			if (!blob) {
				error(new Error('Failed to get blob from canvas'));
				return;
			}
			resolve(blob);
		})
	);
}
