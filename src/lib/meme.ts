import type { Effect } from './effect';
import type { Point } from './geometry/point';
import type { Rectangle } from './geometry/rectangle';
import type { BlendMode, ComposeMode, Graphics, TargetFrameBuffer } from './graphics/graphics';
import { parseColorBytes } from './graphics/shader';
import { TextStencilService } from './graphics/text_stencil_service';
import type { TextureManager } from './graphics/textures';
import type { ImageContent } from './image';
import type { TextDrawInfo, TextManager } from './text/manager';
import type { TextStyle } from './text/text';

export type TextContent = {
	text: string;
	style: TextStyle;
};

export interface GlobalContainer {
	// percents
	maxWidth: number;
	maxHeight: number;
	minHeight: number;
	textPadding: number;
}
export type Container =
	| {
			type: 'rectangle';
			value: Rectangle;
	  }
	| {
			type: 'global';
			value: GlobalContainer;
	  };
export type Content<TextT = TextContent, ImageT = ImageContent> =
	| {
			type: 'text';
			value: TextT;
	  }
	| {
			type: 'image';
			value: ImageT;
	  };

export type Block = {
	id: string;
	container: Container;
	content: Content;
	effects: Effect[];
	layer: LayerSettings;
};

export type LayerSettings = {
	blendMode: BlendMode;
	composeMode: ComposeMode;
	alpha: number;
};

export type Frame<B = Block> = {
	id: string;
	blocks: B[];
	width: number;
	height: number;
	backgroundColor: string;
	backgroundAlpha: number;
};
export type Meme<F = Frame> = {
	frames: F[];
};
import * as twgl from 'twgl.js';
export class FrameDrawer {
	private contentRenderers: Record<'text' | 'image', ContentRenderer<unknown>>;
	private backgroundTexture: WebGLTexture;
	constructor(
		readonly gl: WebGL2RenderingContext,
		textures: TextureManager,
		textManager: TextManager,
		readonly graphics: Graphics
	) {
		this.contentRenderers = {
			image: new ImageContentRenderer(textures),
			text: new TextContentRenderer(new TextStencilService(gl, textManager))
		};
		this.backgroundTexture = twgl.createTexture(gl, { src: [255, 255, 255, 255] });
	}
	clear() {
		this.graphics.clear();
	}
	drawFrame(frame: Frame) {
		this.graphics.resize(frame.width, frame.height);
		const gl = this.gl;
		const backgroundAlpha = frame.backgroundAlpha ?? 1.0;
		const backgroundColor = parseColorBytes(frame.backgroundColor ?? '#ff0000').map((c) => c);
		twgl.setTextureFromArray(gl, this.backgroundTexture, [
			...backgroundColor,
			backgroundAlpha * 255
		]);
		let effectBuffer = this.graphics.buffersPull.get(frame.width, frame.height);
		const layerBuffer = this.graphics.buffersPull.get(frame.width, frame.height);
		let composedBuffer = this.graphics.buffersPull.get(frame.width, frame.height);

		const blocksCount = frame.blocks.length;
		const lastBlock = blocksCount - 1;
		for (let i = 0; i < blocksCount; i++) {
			const block = frame.blocks[i];
			const layers = this.drawBlock(frame, block);
			const layersCount = layers.length;
			const lastLayer = layersCount - 1;
			for (let j = 0; j < layersCount; j++) {
				const draw = layers[j];
				gl.bindFramebuffer(gl.FRAMEBUFFER, layerBuffer.framebuffer);
				gl.clear(gl.COLOR_BUFFER_BIT);
				draw(effectBuffer, layerBuffer);
				this.graphics.blendTo(
					block.layer.blendMode,
					block.layer.composeMode,
					layerBuffer,
					block.layer.alpha,
					i == 0 && j == 0 ? this.backgroundTexture : composedBuffer.attachments[0],
					i == lastBlock && j == lastLayer ? this.graphics.canvasRenderBuffer : effectBuffer
				);
				const tmp = effectBuffer;
				effectBuffer = composedBuffer;
				composedBuffer = tmp;
			}
		}
		this.graphics.buffersPull.free(effectBuffer);
		this.graphics.buffersPull.free(layerBuffer);
		this.graphics.buffersPull.free(composedBuffer);
	}

	drawBlock(
		frame: Frame,
		block: Block
	): Array<(buffer: twgl.FramebufferInfo, destination: twgl.FramebufferInfo) => void> {
		const { graphics } = this;
		const { container, content } = block;
		const renderer = this.contentRenderers[content.type];
		const { drawers, rectangle } =
			container.type === 'global'
				? renderer.drawGlobal(graphics, content.value, frame, container.value)
				: renderer.drawInRectangle(graphics, content.value, container.value);
		return drawers.map(
			block.effects.length == 0
				? (d) => (_buf: twgl.FramebufferInfo, dst: twgl.FramebufferInfo) => d(dst)
				: (d) => (buf: twgl.FramebufferInfo, destination: twgl.FramebufferInfo) => {
						this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buf.framebuffer);
						this.gl.clear(this.gl.COLOR_BUFFER_BIT);
						d(buf);
						graphics.drawModifications(block.effects, rectangle, buf, destination, true);
				  }
		);
	}

	measureBlock(frame: Frame, block: Block): Rectangle {
		const { container, content } = block;
		const renderer = this.contentRenderers[content.type];
		return container.type === 'global'
			? renderer.measureGlobalRectangle(content.value, frame, container.value)
			: container.value;
	}
}

type ContentDrawData = {
	drawers: Array<(destination: TargetFrameBuffer) => void>;
	rectangle: Rectangle;
};

interface ContentRenderer<T> {
	drawInRectangle(graphics: Graphics, content: T, rectangle: Rectangle): ContentDrawData;
	drawGlobal(
		graphics: Graphics,
		content: T,
		frame: Frame,
		global: GlobalContainer
	): ContentDrawData;
	measureGlobalRectangle(content: T, frame: Frame, global: GlobalContainer): Rectangle;
}

class TextContentRenderer implements ContentRenderer<TextContent> {
	constructor(private textService: TextStencilService) {}
	private prepareRectangle(content: TextContent, frame: Frame<Block>, global: GlobalContainer) {
		const { text, style } = content;
		const lines = text.split('\n');
		const linesCount = lines.length;
		const symbolsCount = Math.max(...lines.map((l) => l.length));
		const width = frame.width * global.maxWidth;
		const height =
			frame.height *
			Math.max(
				global.minHeight,
				Math.min(
					global.maxHeight,
					linesCount * (0.175 + Math.max(-0.05, 0.03 * (2.5 - symbolsCount / 10)))
				)
			);
		const textStencil = this.textService.getTextStencil(text, style, width, height);
		const fontShift = global.textPadding;
		const verticalShift = height / 2 + textStencil.info.fontSize * fontShift;
		const baseline = style.baseline;
		const y =
			baseline == 'top'
				? verticalShift
				: baseline == 'middle'
				? frame.height / 2
				: frame.height - verticalShift;
		return {
			textStencil,
			rect: {
				width,
				height,
				rotation: 0,
				position: { x: frame.width / 2, y }
			}
		};
	}
	measureGlobalRectangle(
		content: TextContent,
		frame: Frame<Block>,
		global: GlobalContainer
	): Rectangle {
		return this.prepareRectangle(content, frame, global).rect;
	}
	drawInRectangle(graphics: Graphics, content: TextContent, rect: Rectangle): ContentDrawData {
		const { text, style } = content;
		const textStencil = this.textService.getTextStencil(text, style, rect.width, rect.height);
		return {
			drawers: this.draw(graphics, textStencil, rect, style),
			rectangle: rect
		};
	}
	drawGlobal(
		graphics: Graphics,
		content: TextContent,
		frame: Frame,
		global: GlobalContainer
	): ContentDrawData {
		const { style } = content;
		const { textStencil, rect } = this.prepareRectangle(content, frame, global);
		return {
			drawers: this.draw(graphics, textStencil, rect, style),
			rectangle: rect
		};
	}
	private draw(
		graphics: Graphics,
		stencil: { stencil: WebGLTexture; info: TextDrawInfo },
		rect: Rectangle,
		style: TextStyle
	) {
		const enableStroke = style.stroke.settings.type !== 'disabled';
		const enableFill = style.fill.settings.type !== 'disabled';
		const channels = (+enableStroke * 1) | (+enableFill * 2);
		const drawers = new Array<(destination: TargetFrameBuffer) => void>();
		if (enableStroke) {
			const shadow = style.stroke.shadow;
			if (shadow)
				drawers.push((destination) =>
					graphics.drawShadow(stencil.stencil, 1, channels, rect, style.stroke, shadow, destination)
				);
			drawers.push((destination) =>
				graphics.drawStencilLayer(stencil.stencil, 1, channels, rect, style.stroke, destination)
			);
		}
		if (enableFill) {
			const shadow = style.fill.shadow;
			if (shadow)
				drawers.push((destination) =>
					graphics.drawShadow(stencil.stencil, 2, channels, rect, style.fill, shadow, destination)
				);
			drawers.push((destination) =>
				graphics.drawStencilLayer(stencil.stencil, 2, channels, rect, style.fill, destination)
			);
		}
		return drawers;
	}
}

class ImageContentRenderer implements ContentRenderer<ImageContent> {
	constructor(readonly textures: TextureManager) {}
	measureGlobalRectangle(
		_content: ImageContent,
		frame: Frame<Block>,
		global: GlobalContainer
	): Rectangle {
		return {
			width: frame.width * global.maxWidth,
			height: frame.height * global.maxHeight,
			position: { x: frame.width / 2, y: frame.height / 2 },
			rotation: 0
		};
	}
	drawInRectangle(
		graphics: Graphics,
		content: ImageContent,
		rectangle: Rectangle
	): ContentDrawData {
		const image = this.textures.get(content.id);
		const actualRect = this.cropImage(image, rectangle, content.crop);
		return {
			drawers: [
				(destination: TargetFrameBuffer) =>
					graphics.drawRectImage(
						image.texture,
						actualRect.rectangle,
						actualRect.texCoords,
						destination
					)
			],
			rectangle
		};
	}
	drawGlobal(
		graphics: Graphics,
		content: ImageContent,
		frame: Frame,
		global: GlobalContainer
	): ContentDrawData {
		const rect = this.measureGlobalRectangle(content, frame, global);
		return this.drawInRectangle(graphics, content, rect);
	}
	private cropImage(
		image: { width: number; height: number },
		destination: Rectangle,
		crop: Rectangle
	): { rectangle: Rectangle; texCoords: Point[] } {
		const transform = twgl.m4.scale(
			twgl.m4.rotateZ(
				twgl.m4.scale(twgl.m4.translation([crop.position.x, crop.position.y, 0]), [
					1 / image.width,
					1 / image.height,
					1
				]),
				crop.rotation
			),
			[crop.width * image.width, crop.height * image.height, 1]
		);
		const texCoords = [
			twgl.v3.create(0 - 0.5, 0 - 0.5),
			twgl.v3.create(1 - 0.5, 0 - 0.5),
			twgl.v3.create(1 - 0.5, 1 - 0.5),
			twgl.v3.create(0 - 0.5, 1 - 0.5)
		].map((p) => {
			const v = twgl.m4.transformPoint(transform, p, p);
			return { x: v[0], y: v[1] };
		});
		return { rectangle: destination, texCoords };
	}
}
