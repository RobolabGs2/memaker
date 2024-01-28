import type { Container, Content, Meme, TextContent } from '$lib/meme';
import JSZip from 'jszip';
import type { Material, MaterialSettings, MaterialType, ShadowSettings } from './material';
import type { TextAlign, TextBaseline, TextCase, TextStyle } from './text/text';
import { downloadImage, useBlobUrl } from './utils';
import type { FontSettings } from './text/font';
import type { Rectangle } from './geometry/rectangle';

type MemeVersions =
	| MemeDataV0_2_0
	| MemeDataV0_2_1
	| MemeDataV0_2_2
	| MemeDataV0_2_3
	| MemeDataV0_2_4;

export type MemeFile<MemeV extends MemeVersions = MemeData> = {
	meme: MemeV['meme'];
	resources: { images: string[]; patterns: string[] };
	formatVersion: string;
	editorVersion: string;
};
export interface MemeData {
	meme: Meme;
	resources: { images: { id: string; blob: Blob }[]; patterns: { name: string; blob: Blob }[] };
}

type TextContentV0_2_0<Style = TextStyleV0_2_0> = {
	text: string;
	style: Style;
};

interface TextStyleV0_2_0 {
	font: FontSettings;
	lineSpacing: number;
	case: TextCase;
	align: TextAlign;
	baseline: TextBaseline;
	fill: Material;
	stroke: Material;
	strokeWidth: number;
	experimental: Record<string, never>;
}

interface ImageContentV0_2_0 {
	id: string;
}

interface ImageContentV0_2_3 {
	id: string;
	name: string;
	crop: Rectangle;
}

type BlockV0_2_0 = {
	id: string;
	container: Container;
	content: Content<TextContentV0_2_0, ImageContentV0_2_0>;
};

type FrameV0_2_0<Block = BlockV0_2_0> = {
	id: string;
	blocks: Block[];
	width: number;
	height: number;
};
interface MemeDataV0_2_0 {
	version?: '0.2.0';
	meme: Meme<FrameV0_2_0>;
	resources: { images: { id: string; blob: Blob }[] };
}
interface MemeDataV0_2_1 {
	version?: '0.2.1';
	meme: Meme<FrameV0_2_0>;
	resources: { images: { id: string; blob: Blob }[]; patterns: { name: string; blob: Blob }[] };
}
type BlockV0_2_2 = {
	id: string;
	container: Container;
	content: Content<TextContentV0_2_0, ImageContentV0_2_0>;
	effects: { settings: Record<string, unknown> }[];
};

type BlockV0_2_3 = {
	id: string;
	container: Container;
	content: Content<TextContentV0_2_0, ImageContentV0_2_3>;
	effects: { settings: Record<string, unknown> }[];
};

type BlockV0_2_4 = {
	id: string;
	container: Container;
	content: Content<TextContentV0_2_0, ImageContentV0_2_3>;
	effects: { settings: Record<string, unknown> }[];
	layer: LayerSettingsV0_2_4;
};

type LayerSettingsV0_2_4 = {
	blendMode: string;
	composeMode: string;
};

interface MemeDataV0_2_2 {
	version?: '0.2.2';
	meme: Meme<FrameV0_2_0<BlockV0_2_2>>;
	resources: {
		images: { id: string; blob: Blob }[];
		patterns: { name: string; blob: Blob }[];
	};
}

interface MemeDataV0_2_3 {
	version?: '0.2.3';
	meme: Meme<FrameV0_2_0<BlockV0_2_3>>;
	resources: {
		images: { id: string; blob: Blob }[];
		patterns: { name: string; blob: Blob }[];
	};
}

interface MemeDataV0_2_4 {
	version?: '0.2.4';
	meme: Meme<FrameV0_2_0<BlockV0_2_4>>;
	resources: {
		images: { id: string; blob: Blob }[];
		patterns: { name: string; blob: Blob }[];
	};
}

/**
 * -1 -> a < b
 *  0 -> a = b
 *  1 -> a > b
 */
function compareMemeVersions(a: string, b: string | undefined): -1 | 0 | 1 {
	if (!b) return 1;
	if (a === b) return 0;
	const [a_major, a_minor, a_patch] = a.split('.').map((x) => Number(x));
	const [b_major, b_minor, b_patch] = b.split('.').map((x) => Number(x));
	if (a_major < b_major) return -1;
	if (a_major > b_major) return 1;
	if (a_minor < b_minor) return -1;
	if (a_minor > b_minor) return 1;
	if (a_patch < b_patch) return -1;
	if (a_patch > b_patch) return 1;
	return 0;
}

function olderThan<T extends MemeVersions>(
	file: MemeFile<MemeVersions>,
	data: MemeVersions,
	v: string
): data is T {
	return compareMemeVersions(file.formatVersion, v) === -1;
}

function upToVersion<From extends MemeVersions>(
	file: MemeFile<MemeVersions>,
	v: string,
	migration: (old: From) => Exclude<MemeVersions, From>
): (data: MemeVersions) => Exclude<MemeVersions, From> {
	return (data: MemeVersions) => {
		if (olderThan<From>(file, data, v)) return migration(data);
		return data as Exclude<MemeVersions, From>;
	};
}

function castVersionToActual<From extends MemeVersions>(
	fromVersion: string,
	actualV: string
): (data: From) => MemeData {
	return (data: MemeVersions) => {
		if (fromVersion !== actualV)
			throw new UnsupportedFormatError(
				`logic error: not enough migrations from '${fromVersion}' to '${actualV}'`
			);
		return data as MemeData;
	};
}

export class MemeFormat {
	static FormatVersion = '0.2.4';
	static EditorVersion = import.meta.env.VITE_APP_VERSION;
	static fromFile(file: Blob): Promise<MemeData> {
		const zip = new JSZip();
		return zip.loadAsync(file).then((zip) => {
			const index = zip.file('index.json');
			if (!index)
				return MemeFormat.zeroVersion(zip)
					.then(MemeFormat.fromV0_2_0ToV0_2_1)
					.then(MemeFormat.fromV0_2_1ToV0_2_2)
					.then(MemeFormat.fromV0_2_2ToV0_2_3)
					.then(MemeFormat.fromV0_2_3ToV0_2_4)
					.then(castVersionToActual('0.2.4', this.FormatVersion));
			return index.async('string').then((json) => {
				const index = JSON.parse(json, (key, value) => {
					if (key === 'container' && value.type === 'global') {
						value.value.minHeight = 0.1;
					}
					return value;
				}) as MemeFile<MemeVersions>;
				if (compareMemeVersions(this.FormatVersion, index.formatVersion) == -1)
					throw new UnsupportedFormatError(
						`application version ${this.FormatVersion} lower than file version ${index.formatVersion}`
					);
				return Promise.all([
					Promise.all(
						index.resources.images.map((id) => {
							const image = zip.file(this.imageFilepath(id));
							if (!image) throw new Error(`Not found image with id ${id}`);
							return image.async('blob').then((blob) => ({ id, blob }));
						})
					),
					Promise.all(
						(index.resources.patterns || []).map((name) => {
							const image = zip.file(this.patternFilepath(name));
							if (!image) throw new Error(`Not found pattern with id ${name}`);
							return image.async('blob').then((blob) => ({ name, blob }));
						})
					)
				])
					.then(
						([images, patterns]) =>
							({ meme: index.meme, resources: { images, patterns } } as MemeVersions)
					)
					.then(upToVersion(index, '0.2.1', this.fromV0_2_0ToV0_2_1))
					.then(upToVersion(index, '0.2.2', this.fromV0_2_1ToV0_2_2))
					.then(upToVersion(index, '0.2.3', this.fromV0_2_2ToV0_2_3))
					.then(upToVersion(index, '0.2.4', this.fromV0_2_3ToV0_2_4))
					.then(castVersionToActual('0.2.4', this.FormatVersion));
			});
		});
	}
	private static fromV0_2_0ToV0_2_1(data: MemeDataV0_2_0): MemeDataV0_2_1 {
		return {
			...data,
			version: '0.2.1',
			resources: { ...data.resources, patterns: [] }
		};
	}
	private static fromV0_2_1ToV0_2_2(data: MemeDataV0_2_1): MemeDataV0_2_2 {
		return {
			...data,
			version: '0.2.2',
			meme: {
				frames: data.meme.frames.map((f) => {
					return { ...f, blocks: f.blocks.map((b) => ({ ...b, effects: [] })) };
				})
			}
		};
	}
	private static fromV0_2_2ToV0_2_3(data: MemeDataV0_2_2): MemeDataV0_2_3 {
		return {
			...data,
			version: '0.2.3',
			meme: {
				frames: data.meme.frames.map((f) => {
					return {
						...f,
						backgroundColor: '#ffffff',
						backgroundAlpha: 1,
						blocks: f.blocks.map((b) => ({
							...b,
							content:
								b.content.type == 'image'
									? {
											type: 'image',
											value: {
												name: 'Фон',
												id: b.content.value.id,
												crop: { position: { x: 0.5, y: 0.5 }, width: 1, height: 1, rotation: 0 }
											}
									  }
									: b.content,
							effects: b.effects.map((oldEffect) => {
								const settings = oldEffect.settings;
								const type = settings.type as string;
								delete settings['type'];
								return { type, settings };
							})
						}))
					};
				})
			}
		};
	}
	private static fromV0_2_3ToV0_2_4(data: MemeDataV0_2_3): MemeDataV0_2_4 {
		return {
			...data,
			version: '0.2.4',
			meme: {
				frames: data.meme.frames.map((f) => {
					return {
						...f,
						blocks: f.blocks.map((b) => ({
							...b,
							layer: { blendMode: 'normal', composeMode: 'source_over' }
						}))
					};
				})
			}
		};
	}
	static toFile(data: MemeData): Promise<Blob> {
		const zip = new JSZip();
		data.resources.images.forEach(({ id, blob }) => {
			zip.file(this.imageFilepath(id), blob, { binary: true });
		});
		data.resources.patterns.forEach(({ name, blob }) => {
			zip.file(this.patternFilepath(name), blob, { binary: true });
		});
		const memeFile: MemeFile = {
			meme: data.meme,
			formatVersion: this.FormatVersion,
			editorVersion: this.EditorVersion,
			resources: {
				images: data.resources.images.map((t) => t.id),
				patterns: data.resources.patterns.map((t) => t.name)
			}
		};
		zip.file('index.json', JSON.stringify(memeFile));
		return zip.generateAsync({ type: 'blob' });
	}
	static imageFilepath(id: string): string {
		return `resources/images/${id}.png`;
	}
	static patternFilepath(id: string): string {
		return `resources/patterns/${id}.png`;
	}
	static zeroVersion(zip: JSZip): Promise<MemeDataV0_2_0> {
		const jsonFile = zip.file('text.json');
		if (!jsonFile) throw new UnsupportedFormatError('Unknown format');
		const version = jsonFile.comment;
		return jsonFile.async('string').then((text) => {
			const texts = JSON.parse(text) as (string | Record<string, unknown>)[];
			const images = zip.file(/.*\.png/);
			const frames = new Array<FrameV0_2_0>(images.length);
			return Promise.all(
				images.map((img) =>
					img.async('blob').then((blob) => {
						const frameIndex = +img.name.substring(0, img.name.length - '.png'.length);
						return this.imageSizes(blob)
							.then(({ width, height }) => {
								const frame: FrameV0_2_0 = {
									id: `old-frame-${frameIndex}`,
									blocks: [
										{
											id: `old-frame-${frameIndex}-background`,
											container: {
												type: 'global',
												value: { maxHeight: 1, maxWidth: 1, minHeight: 1 }
											},
											content: { type: 'image', value: { id: img.name } }
										}
									],
									height,
									width
								};
								frames[frameIndex] = frame;
								return;
							})
							.then(() => ({ id: img.name, blob }));
					})
				)
			).then((images) => {
				for (let i = 0; i < texts.length; i++) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const frameJSON = texts[i] as any;
					const frame = frames[i];
					if (!version) {
						const text: string =
							typeof frameJSON == 'string' ? frameJSON : (frameJSON.text as string);
						const oldStyle =
							typeof frameJSON == 'string'
								? ZeroZeroVersionTypes.DefaultStyle()
								: (frameJSON.textContent.style as ZeroZeroVersionTypes.TextStylePrototype);
						const content: TextContent = {
							text,
							style: convertZeroZeroToActualStyle(
								ZeroZeroVersionTypes.mergePartials(ZeroZeroVersionTypes.DefaultStyle(), oldStyle),
								true
							)
						};
						frame.blocks.push({
							id: `old-frame-${i}-block-0`,
							container: {
								type: 'global',
								value: { maxHeight: 0.4, maxWidth: 0.96, minHeight: 0.1 }
							},
							content: {
								type: 'text',
								value: content
							}
						});
					} else
						switch (version) {
							case 'v0.0.3':
								frame.blocks.push(
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									...(frameJSON.textContent as any[]).map((c: any, blockIndex: number) => {
										const box = c.box;
										const style = ZeroZeroVersionTypes.mergePartials(
											ZeroZeroVersionTypes.DefaultStyle(),
											c.style
										);
										return {
											id: `old-frame-${i}-block-${blockIndex}`,
											container: c.main
												? ({
														type: 'global',
														value: {
															maxHeight: 0.4,
															maxWidth: 0.96,
															minHeight: 0.1
														}
												  } as const)
												: ({
														type: 'rectangle',
														value: {
															height: box.height,
															width: box.width,
															position: { x: box.x, y: box.y },
															rotation: 0
														}
												  } as const),
											content: {
												type: 'text' as const,
												value: {
													text: c.text as string,
													style: convertZeroZeroToActualStyle(style, c.main)
												}
											}
										};
									})
								);
								break;
							case 'v0.0.4':
								frame.blocks.push(
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									...(frameJSON.textContent as any[]).map((c: any, blockIndex: number) => {
										const box = c.box;
										const style = ZeroZeroVersionTypes.mergePartials(
											ZeroZeroVersionTypes.DefaultStyle(),
											c.style
										);
										return {
											id: `old-frame-${i}-block-${blockIndex}`,
											container: c.main
												? ({
														type: 'global',
														value: {
															maxHeight: 0.4,
															minHeight: 0.1,
															maxWidth: 0.96
														}
												  } as const)
												: ({
														type: 'rectangle',
														value: {
															height: box._height,
															width: box._width,
															position: { x: box.transform.x, y: box.transform.y },
															rotation: box.transform.rotate
														}
												  } as const),
											content: {
												type: 'text' as const,
												value: {
													text: c.text as string,
													style: convertZeroZeroToActualStyle(style, c.main)
												}
											}
										};
									})
								);
								break;

							default:
								throw new UnsupportedFormatError(`Unexpected legacy version ${version}`);
						}
				}
				return {
					meme: { frames },
					resources: { images }
				};
			});
		});
	}
	private static imageSizes(blob: Blob): Promise<{ width: number; height: number }> {
		return useBlobUrl(blob, downloadImage);
	}
}

export class UnsupportedFormatError extends Error {
	constructor(reason: string, cause?: Error) {
		super(`Unsupported version: ${reason}`, { cause });
	}
}

function convertZeroZeroToActualStyle(
	oldStyle: ZeroZeroVersionTypes.TextStylePrototype,
	isMain: boolean
): TextStyle {
	const shadow: undefined | ShadowSettings = oldStyle.shadow?.enabled
		? {
				blur: oldStyle.shadow.blur,
				color: oldStyle.shadow.color,
				offset: oldStyle.shadow.offset
		  }
		: undefined;
	return {
		align: 'center',
		baseline: isMain ? 'bottom' : 'middle',
		case: oldStyle.case,
		experimental: {},
		fill: {
			alpha: 1,
			shadow,
			settings: convertZeroZeroToActualMaterial(oldStyle.fill)
		},
		stroke: { alpha: 1, shadow, settings: convertZeroZeroToActualMaterial(oldStyle.stroke) },
		lineSpacing:
			oldStyle.experimental.lineWidthCoefficient *
			(oldStyle.experimental.lineSpacingCoefficient - 0.5),
		strokeWidth: oldStyle.experimental.lineWidthCoefficient * 100,
		font: oldStyle.font
	};
}

function convertZeroZeroToActualMaterial(
	brush: ZeroZeroVersionTypes.BrushPath
): MaterialSettings<MaterialType> {
	switch (brush.type) {
		case 'color':
			return {
				type: 'color',
				value: brush.name
			} as MaterialSettings<'color'>;
		case 'pattern':
			return {
				type: 'pattern',
				name: brush.name,
				rotate: brush.patternSettings.rotate,
				scale: brush.patternSettings.scale,
				shift: brush.patternSettings.shift
			} as MaterialSettings<'pattern'>;
		case 'none':
			return {
				type: 'disabled'
			} as MaterialSettings<'disabled'>;
		default:
			throw new UnsupportedFormatError(
				`Failed convert old brush ${JSON.stringify(brush)} to material settings`
			);
	}
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace ZeroZeroVersionTypes {
	export interface BrushPath {
		type: 'color' | 'pattern' | 'none';
		name: string;
		patternSettings: {
			scale: 'font' | { x: number; y: number };
			rotate: number;
			shift: { x: number; y: number };
		};
	}
	export type CaseType = 'As is' | 'UPPER' | 'lower';
	export interface FontSettings {
		italic: boolean;
		smallCaps: boolean;
		bold: boolean;
		family: string;
	}
	export interface TextStylePrototype {
		name: string;
		font: FontSettings;
		case: CaseType;
		fill: BrushPath;
		stroke: BrushPath;
		shadow: ShadowSettings;
		experimental: ExperimentalSettings;
	}

	export interface ExperimentalSettings {
		lineWidthCoefficient: number;
		lineSpacingCoefficient: number;
		interpolationPoint: number;
	}

	export interface ShadowSettings {
		enabled?: boolean;
		blur: number; // 0 <= blur
		color: string;
		offset: Point;
	}
	export interface Point {
		x: number;
		y: number;
	}
	export function DefaultStyle(): TextStylePrototype {
		return {
			case: 'UPPER',
			fill: {
				name: '#ffffff',
				type: 'color',
				patternSettings: { rotate: 0, scale: { x: 1, y: 1 }, shift: { x: 0, y: 0 } }
			},
			stroke: {
				name: '#000000',
				type: 'color',
				patternSettings: { rotate: 0, scale: { x: 1, y: 1 }, shift: { x: 0, y: 0 } }
			},
			name: 'custom',
			font: {
				bold: false,
				family: 'Impact',
				italic: false,
				smallCaps: false
			},
			shadow: {
				enabled: false,
				color: '#000000',
				blur: 10,
				offset: { x: 0, y: 0 }
			},
			experimental: {
				lineSpacingCoefficient: 0.5,
				lineWidthCoefficient: 0.1385,
				interpolationPoint: 100
			}
		};
	}
	export type RecursivePartial<T> = {
		[P in keyof T]?: T[P] extends (infer U)[]
			? RecursivePartial<U>[]
			: T[P] extends object
			? RecursivePartial<T[P]>
			: T[P];
	};
	// eslint-disable-next-line no-inner-declarations
	function isObject(a: unknown): a is object {
		return a !== null && typeof a === 'object';
	}
	export function mergePartials<T extends object>(defaults: T, overrides: RecursivePartial<T>): T {
		for (const x in defaults) {
			const actual = overrides[x];
			const defaultValue = defaults[x];
			if (isObject(defaultValue) && (!actual || isObject(actual))) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				overrides[x] = mergePartials(defaultValue, actual || {}) as any;
			} else if (actual === undefined) {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				overrides[x] = defaultValue as any;
			}
		}
		return overrides as T;
	}
}
