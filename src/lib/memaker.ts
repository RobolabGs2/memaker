import { patternsNames } from '$lib/material/pattern/store';
import JSZip from 'jszip';
import { tick } from 'svelte';
import type { Writable } from 'svelte/store';
import { TextureManager, type Texture } from './graphics/textures';
import { IdGenerator } from './id_generator';
import { FrameDrawer, type Block, type Frame, type Meme } from './meme';
import { MemeFormat } from './meme_format';
import { deepCopy, type StateStore } from './state';
import { forceLoadFonts, loadFontStatistics } from './text/fonts_store';
import { defaultStyle } from './text/presets';
import { useBlobUrl } from './utils';
import { TextManager } from './text/manager';
import { Graphics } from './graphics/graphics';
import type { RawShader } from './graphics/shader';
import type { ImageContent } from './image';

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

export function defaultBlockSettings(): Omit<Block, 'id' | 'container' | 'content'> {
	return {
		effects: [],
		layer: { blendMode: 'normal', composeMode: 'source_over', alpha: 1.0 }
	};
}

export class Memaker {
	private textures: TextureManager<TextureMeta>;
	public readonly drawer: FrameDrawer;
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
	readonly gl: WebGL2RenderingContext;
	constructor(
		readonly stores: {
			meme: StateStore<Meme>;
			frame: StateStore<Frame>;
			block: StateStore<Block>;
			previews: StateStore<Record<string, (canvas: HTMLCanvasElement) => void>>;
			busy: Writable<string>;
			error: Writable<unknown>;
		},
		canvas: HTMLCanvasElement,
		defaultPatterns: { name: string; url: string }[],
		placeholdersUrls: SkinsMap,
		skinKey: string,
		shaders: {
			materials: Record<string, RawShader>;
			effects: Record<string, RawShader>;
		}
	) {
		const gl = canvas.getContext('webgl2', { premultipliedAlpha: false });
		if (!gl) throw new Error('Failed to create WebGL2 context!');
		this.gl = gl;
		this.textures = new TextureManager(gl);
		const fontMetrics = loadFontStatistics();
		const graphics = new Graphics(gl, this.textures, shaders.materials, shaders.effects);
		this.drawer = new FrameDrawer(gl, this.textures, new TextManager(fontMetrics.store), graphics);
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
		this.runTask('Загрузка метрик шрифтов', fontMetrics.then);
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
	private backgroundTasks: Map<Promise<unknown>, string> = new Map();
	private runTask<T>(description: string, task: Promise<T>): Promise<T> {
		this.backgroundTasks.set(task, description);
		this.stores.busy.set(this.currentTask);
		task.catch((err) => {
			this.stores.error.set(err);
			throw err;
		});
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
		const nextIndex = curIndex + dir;
		if (nextIndex < 0 || blocks.length <= nextIndex) return;
		blocks[curIndex] = blocks[nextIndex];
		blocks[nextIndex] = block;
		this.frameUpdated();
	}
	shiftFrame(block: Frame, dir: -1 | 1) {
		const frames = this.meme.frames;
		const curIndex = frames.indexOf(block);
		const nextIndex = curIndex + dir;
		if (nextIndex < 0 || frames.length <= nextIndex) return;
		frames[curIndex] = frames[nextIndex];
		frames[nextIndex] = block;
		this.memeUpdated();
	}
	blockIdGenerator = new IdGenerator('v.0.2.0-' + Date.now().toString() + '-');
	cloneBlock(block: Block) {
		const newBlock = deepCopy(block);
		newBlock.id = this.blockIdGenerator.generate();
		this.addBlock(newBlock);
	}
	// newBlock should have correct id
	private addBlock(newBlock: Block) {
		this.addImageUsage(newBlock);
		this.activeFrame.blocks.push(newBlock);
		this.frameUpdated();
		this.activeBlock = newBlock;
		this.blockUpdated();
	}
	addTextBlock(newBlock = this.activeBlock) {
		// temporary crutch
		if (newBlock.content.type !== 'text') {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			newBlock = this.activeFrame.blocks.find((b) => b.content.type === 'text') || {
				...defaultBlockSettings(),
				id: this.blockIdGenerator.generate(),
				container: {
					type: 'global',
					value: {
						maxWidth: 0.96,
						maxHeight: 0.4,
						minHeight: 0,
						textPadding: 2 / 9
					}
				},
				content: {
					type: 'text',
					value: {
						text: '',
						style: defaultStyle
					}
				}
			};
		}
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
		this.addBlock(newBlock);
	}
	newImageBlock(name: string, texture: Texture) {
		const frame = this.activeFrame;
		let width = texture.width;
		let height = texture.height;
		const ratio = width / height;
		if (width > frame.width * 0.6) {
			width = frame.width * 0.6;
			height = width / ratio;
		}
		if (height > frame.height * 0.6) {
			height = frame.height * 0.6;
			width = height * ratio;
		}

		const newBlock: Block = {
			...defaultBlockSettings(),
			id: this.blockIdGenerator.generate(),
			container: {
				type: 'rectangle',
				value: {
					height,
					width,
					position: { x: frame.width / 2, y: frame.height / 2 },
					rotation: 0
				}
			},
			content: {
				type: 'image',
				value: {
					name: name,
					id: texture.id,
					crop: { position: { x: 0.5, y: 0.5 }, height: 1, rotation: 0, width: 1 }
				}
			}
		};
		this.addBlock(newBlock);
	}
	addImageBlock(file?: File) {
		if (!file) {
			this.newImageBlock(
				'Картинка',
				this.placeholdersTextures[Math.floor(Math.random() * this.placeholdersTextures.length)]
			);
			return;
		}
		const reader = new FileReader();
		const promise = new Promise<string>((resolve, reject) => {
			reader.addEventListener('load', () => resolve(reader.result as string));
			reader.addEventListener('error', () => reject(reader.error));
		});
		reader.readAsDataURL(file);
		this.runTask(
			'Создаём блок с картинкой',
			promise.then((url) =>
				this.textures
					.downloadImage(url, { meta: { source: 'user', type: 'image' } })
					.then((texture) => {
						const frame = this.activeFrame;
						let width = texture.width;
						let height = texture.height;
						const ratio = width / height;
						if (width > frame.width * 0.6) {
							width = frame.width * 0.6;
							height = width / ratio;
						}
						if (height > frame.height * 0.6) {
							height = frame.height * 0.6;
							width = height * ratio;
						}

						const newBlock: Block = {
							...defaultBlockSettings(),
							id: this.blockIdGenerator.generate(),
							container: {
								type: 'rectangle',
								value: {
									height,
									width,
									position: { x: frame.width / 2, y: frame.height / 2 },
									rotation: 0
								}
							},
							content: {
								type: 'image',
								value: {
									name: file.name,
									id: texture.id,
									crop: { position: { x: 0.5, y: 0.5 }, height: 1, rotation: 0, width: 1 }
								}
							}
						};
						this.addImageUsage(newBlock);

						this.activeFrame.blocks.push(newBlock);
						this.frameUpdated();
						this.activeBlock = newBlock;
						this.blockUpdated();
					})
			)
		);
	}
	modifyImageBlock(block: Block, file: File) {
		const content = block.content;
		if (content.type === 'text' || block === this.activeFrame.blocks[0]) {
			this.setBackground(file);
			return;
		}
		const reader = new FileReader();
		const promise = new Promise<string>((resolve, reject) => {
			reader.addEventListener('load', () => resolve(reader.result as string));
			reader.addEventListener('error', () => reject(reader.error));
		});
		reader.readAsDataURL(file);
		this.runTask(
			'Меняем картинку',
			promise.then((url) => {
				this.textures
					.downloadImage(url, { meta: { source: 'user', type: 'image' } })
					.then((texture) => {
						const value = content.value;
						this.removeImageUsage(block);
						value.id = texture.id;
						this.addImageUsage(block);
						const container = block.container;
						if (container.type === 'rectangle') {
							const frame = this.activeFrame;
							let width = texture.width;
							let height = texture.height;
							const ratio = width / height;
							if (width > frame.width * 0.6) {
								width = frame.width * 0.6;
								height = width / ratio;
							}
							if (height > frame.height * 0.6) {
								height = frame.height * 0.6;
								width = height * ratio;
							}
							container.value.height = height;
							container.value.width = width;
						}
						this.frameUpdated();
					});
			})
		);
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
					...defaultBlockSettings(),
					id: this.blockIdGenerator.generate(),
					container: {
						type: 'global',
						value: {
							maxHeight: 1,
							maxWidth: 1,
							minHeight: 1,
							textPadding: 2 / 9
						}
					},
					content: {
						type: 'image',
						value: {
							name: 'Фон',
							id: background.id,
							crop: { position: { x: 0.5, y: 0.5 }, height: 1, rotation: 0, width: 1 }
						}
					}
				},
				{
					...defaultBlockSettings(),
					id: this.blockIdGenerator.generate(),
					container: {
						type: 'global',
						value: {
							maxWidth: 0.96,
							maxHeight: 0.4,
							minHeight: 0,
							textPadding: 2 / 9
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
			width: background.width,
			backgroundAlpha: 1,
			backgroundColor: '#ffffff'
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
		let index = this.meme.frames.length;
		if (index) {
			const currentIndex = this.meme.frames.findIndex((frame) => frame === this.activeFrame);
			if (currentIndex != -1) index = currentIndex + 1;
		}
		this.meme.frames.splice(index, 0, frame);
		this.activeFrame = frame;
		frame.blocks.forEach((b) => this.addImageUsage(b));
		this.memeUpdated();
		this.frameUpdated();
		return frame;
	}
	deleteBlock(block: Block) {
		const blockIndex = this.activeFrame.blocks.indexOf(block);
		if (block.id == this.activeBlock.id) {
			const nextIndex =
				blockIndex == this.activeFrame.blocks.length - 1 ? blockIndex - 1 : blockIndex + 1;
			const nextForSelection = this.activeFrame.blocks[nextIndex];
			this.activeFrame.blocks.splice(blockIndex, 1);
			if (nextForSelection) {
				this.activeBlock = nextForSelection;
				this.blockUpdated();
			} else {
				this.addTextBlock();
			}
		} else {
			this.activeFrame.blocks.splice(blockIndex, 1);
		}
		this.removeImageUsage(block);
		this.frameUpdated();
	}
	deleteFrame(frame: Frame) {
		const frameIndex = this.meme.frames.indexOf(frame);
		if (frame.id == this.activeFrame.id) {
			const nextForSelection =
				frameIndex == this.meme.frames.length - 1 ? frameIndex - 1 : frameIndex + 1;
			if (nextForSelection >= 0) {
				this.activeFrame = this.meme.frames[nextForSelection];
				this.frameUpdated();
			} else {
				this.addFrame();
			}
		}
		this.meme.frames.splice(frameIndex, 1);
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
						let backgroundBlock =
							this.activeFrame.blocks[0].content.type === 'image' &&
							this.activeFrame.blocks[0].container.type === 'global'
								? this.activeFrame.blocks[0]
								: null;
						if (backgroundBlock) {
							const value = this.activeFrame.blocks[0].content.value as ImageContent;
							this.removeImageUsage(this.activeFrame.blocks[0]);
							backgroundBlock.content = {
								type: 'image',
								value: {
									name: value.name,
									id: texture.id,
									crop: { position: { x: 0.5, y: 0.5 }, height: 1, rotation: 0, width: 1 }
								}
							};
						} else {
							backgroundBlock = {
								...defaultBlockSettings(),
								id: this.blockIdGenerator.generate(),
								container: {
									type: 'global',
									value: { maxHeight: 1, maxWidth: 1, minHeight: 1, textPadding: 2 / 9 }
								},
								content: {
									type: 'image',
									value: {
										name: 'Фон',
										id: texture.id,
										crop: { position: { x: 0.5, y: 0.5 }, height: 1, rotation: 0, width: 1 }
									}
								}
							};
							this.activeFrame.blocks.unshift(backgroundBlock);
						}

						this.activeFrame.width = texture.width;
						this.activeFrame.height = texture.height;
						this.addImageUsage(backgroundBlock);
						this.frameUpdated();
					})
			)
		);
	};

	copyFrameToClipboard(): Promise<void> {
		return this.runTask(
			'Копируем',
			this.frameBlob(this.activeFrame).then((blob) => copyImageToClipboard(blob))
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
	getPatternsList(meme: Meme = this.meme) {
		return Array.from(
			new Set(
				meme.frames.flatMap((frame) =>
					frame.blocks
						.map((b) => b.content)
						.flatMap((c) => {
							if (c.type != 'text') return [];
							const patterns = [];
							const style = c.value.style;
							if (style.fill.settings.type == 'pattern') patterns.push(style.fill.settings.name);
							if (style.stroke.settings.type == 'pattern')
								patterns.push(style.stroke.settings.name);
							return patterns;
						})
						.filter((b) => b)
				)
			)
		)
			.map((name) => ({ name, texture: this.textures.get(patternsNames.getTexture(name)) }))
			.filter(({ texture }) => texture.meta.source == 'user');
	}
	private zipCanvas = document.createElement('canvas');
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	private zipCtx = this.zipCanvas.getContext('2d')!;
	exportMeme(): Promise<Blob> {
		const images = this.getImagesList();
		const patterns = this.getPatternsList();

		return this.runTask(
			'Пакуем мем',
			Promise.all([
				Promise.all(
					images.map((texture) => {
						this.zipCanvas.width = texture.width;
						this.zipCanvas.height = texture.height;
						this.zipCtx.drawImage(texture.original, 0, 0);
						return canvasToBlob(this.zipCanvas).then((blob) => ({ id: texture.id, blob }));
					})
				),
				Promise.all(
					patterns.map(({ name, texture }) => {
						this.zipCanvas.width = texture.width;
						this.zipCanvas.height = texture.height;
						this.zipCtx.drawImage(texture.original, 0, 0);
						return canvasToBlob(this.zipCanvas).then((blob) => ({ name, blob }));
					})
				)
			]).then(([images, patterns]) =>
				MemeFormat.toFile({ meme: this.meme, resources: { images, patterns } })
			)
		);
	}
	openMeme(file: Blob) {
		return this.importMeme(file, 'replace', 'replace');
	}
	importMeme(file: Blob, duplicatedPatterns: 'replace' | 'add', newFrames: 'replace' | 'append') {
		const textureIdMapping = new Map<string, string>();
		const patternNameMapping = new Map<string, string>();
		return this.runTask(
			'Распаковываем мем',
			MemeFormat.fromFile(file).then((memeData) => {
				if (newFrames == 'replace') {
					this.getImagesList().forEach((tex) => this.textures.delete(tex.id));
					this.usedImages.clear();
				}
				return Promise.all(
					memeData.resources.images
						.map(({ id, blob }) => {
							return useBlobUrl(
								blob,
								(url) =>
									this.textures
										.downloadImage(url, {
											meta: { source: 'user', type: 'image' }
										})
										.then((texture) => {
											textureIdMapping.set(id, texture.id);
										}) as Promise<unknown>
							);
						})
						.concat(
							memeData.resources.patterns.map(({ name, blob }) =>
								useBlobUrl(blob, (url) => {
									if (patternsNames.has(name)) {
										switch (duplicatedPatterns) {
											case 'replace': {
												this.textures.delete(patternsNames.getTexture(name));
												patternsNames.delete(name);
												break;
											}
											case 'add': {
												let i = 0;
												let newName = name;
												let namePrefix = name;
												const number = /\((\d+)\)$/.exec(name);
												if (number) {
													i = +number[1];
													namePrefix = name.substring(0, number.index);
												}
												do {
													newName = `${namePrefix}(${++i})`;
												} while (patternsNames.has(newName));
												patternNameMapping.set(name, newName);
												name = newName;
												break;
											}
										}
									}
									return this.textures
										.downloadImage(url, {
											meta: { source: 'user', type: 'pattern' }
										})
										.then((texture) => patternsNames.addPattern({ name, textureId: texture.id }));
								})
							)
						)
				)
					.then(() => {
						memeData.meme.frames.forEach((frame) => {
							frame.id = this.blockIdGenerator.generate();
							frame.blocks.forEach((block) => {
								block.id = this.blockIdGenerator.generate();
								const content = block.content;
								switch (content.type) {
									case 'image': {
										const newId = textureIdMapping.get(content.value.id);
										if (newId) content.value.id = newId;
										this.addImageUsage(block);
										break;
									}
									case 'text': {
										const materials = [
											content.value.style.stroke.settings,
											content.value.style.fill.settings
										];
										for (const m of materials) {
											if (m.type !== 'pattern') continue;
											const newName = patternNameMapping.get(m.name);
											if (newName) m.name = newName;
										}
									}
								}
							});
						});
						let frameIndex = this.meme.frames.length;
						switch (newFrames) {
							case 'replace':
								this.meme.frames = [];
								frameIndex = 0;
							// eslint-disable-next-line no-fallthrough
							case 'append':
								this.meme.frames.push(...memeData.meme.frames);
								break;
						}
						this.activeFrame = this.meme.frames[frameIndex];
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
	addPattern(name: string, image: Blob) {
		return this.runTask(
			'Добавляем паттерн',
			useBlobUrl(image, (url) =>
				this.textures.downloadImage(url, { meta: { source: 'user', type: 'pattern' } })
			).then((texture) => {
				const pattern = { name, textureId: texture.id };
				patternsNames.addPattern(pattern);
				return pattern;
			})
		).then(() => this.draw(this.activeFrame));
	}
	updateEffect(key: string, shader: RawShader) {
		
		this.meme.frames.forEach((frame) =>
			frame.blocks.forEach((block) => {
				block.effects.forEach((effect) => {
					if (effect.type !== key) return;

				});
			})
		);
	}
	clear() {
		patternsNames.clear();
		this.textures.clear();
		this.usedImages.clear();
		this.drawer.clear();
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

export class ClipboardItemError extends Error {
	constructor(msg: string, readonly blob: Blob) {
		super(msg);
	}
}

function copyImageToClipboard(blob: Blob) {
	if (!window.ClipboardItem)
		return Promise.reject(
			new ClipboardItemError(
				`Ваш браузер не поддерживает копирование изображений из скриптов.`,
				blob
			)
		);

	return window.navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}
