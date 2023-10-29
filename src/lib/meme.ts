import type { Effect } from './effect';
import type { Point } from './geometry/point';
import type { Rectangle } from './geometry/rectangle';
import type { Graphics, TargetFrameBuffer } from './graphics/graphics';
import { parseColor } from './graphics/shader';
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

export type Block = { id: string; container: Container; content: Content; effects: Effect[] };
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
	}
	clear() {
		this.graphics.clear();
	}
	drawFrame(frame: Frame) {
		this.graphics.resize(frame.width, frame.height);
		const buf = this.graphics.buffersPull.get(frame.width, frame.height);
		const gl = this.gl;
		const background = parseColor(frame.backgroundColor ?? '#ff0000');
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(...background, frame.backgroundAlpha ?? 0.0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0, 0, 0, 0);
		frame.blocks.forEach((block) => {
			this.drawBlock(frame, block, buf);
		});
		this.graphics.buffersPull.free(buf);
	}
	drawBlock(frame: Frame, block: Block, buf: twgl.FramebufferInfo) {
		const { graphics } = this;
		const { container, content } = block;

		let destination = graphics.canvasRenderBuffer;
		if (block.effects.length) {
			destination = buf;
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buf.framebuffer);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		}
		const renderer = this.contentRenderers[content.type];
		const rect =
			container.type === 'global'
				? renderer.drawGlobal(graphics, destination, content.value, frame, container.value)
				: renderer.drawInRectangle(graphics, destination, content.value, container.value);
		if (block.effects.length === 0) return;
		graphics.drawModifications(block.effects, rect, buf, graphics.canvasRenderBuffer, true);
	}
}

interface ContentRenderer<T> {
	drawInRectangle(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		content: T,
		rectangle: Rectangle
	): Rectangle;
	drawGlobal(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		content: T,
		frame: Frame,
		global: GlobalContainer
	): Rectangle;
}

class TextContentRenderer implements ContentRenderer<TextContent> {
	constructor(private textService: TextStencilService) {}
	drawInRectangle(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		content: TextContent,
		rect: Rectangle
	): Rectangle {
		const { text, style } = content;
		const textStencil = this.textService.getTextStencil(text, style, rect.width, rect.height);
		this.draw(graphics, destination, textStencil, rect, style);
		return rect;
	}
	drawGlobal(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		content: TextContent,
		frame: Frame,
		global: GlobalContainer
	): Rectangle {
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
		const fontShift = 2 / 9;
		const verticalShift = height / 2 + textStencil.info.fontSize * fontShift;
		const baseline = style.baseline;
		const y =
			baseline == 'top'
				? verticalShift
				: baseline == 'middle'
				? frame.height / 2
				: frame.height - verticalShift;
		const rect = {
			width,
			height,
			rotation: 0,
			position: { x: frame.width / 2, y }
		};
		this.draw(graphics, destination, textStencil, rect, style);
		return rect;
	}
	private draw(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		stencil: { stencil: WebGLTexture; info: TextDrawInfo },
		rect: Rectangle,
		style: TextStyle
	) {
		const enableStroke = style.stroke.settings.type !== 'disabled';
		const enableFill = style.fill.settings.type !== 'disabled';
		const channels = (+enableStroke * 1) | (+enableFill * 2);
		if (enableStroke)
			graphics.drawStencilLayer(stencil.stencil, 1, channels, rect, style.stroke, destination);
		if (enableFill)
			graphics.drawStencilLayer(stencil.stencil, 2, channels, rect, style.fill, destination);
	}
}

class ImageContentRenderer implements ContentRenderer<ImageContent> {
	constructor(readonly textures: TextureManager) {}
	drawInRectangle(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		content: ImageContent,
		rectangle: Rectangle
	): Rectangle {
		const image = this.textures.get(content.id);
		const actualRect = this.cropImage(image, rectangle, content.crop);
		graphics.drawRectImage(image.texture, actualRect.rectangle, actualRect.texCoords, destination);
		return rectangle;
	}
	drawGlobal(
		graphics: Graphics,
		destination: TargetFrameBuffer,
		content: ImageContent,
		frame: Frame,
		global: GlobalContainer
	): Rectangle {
		const size = graphics.size;
		const rect = {
			width: frame.width * global.maxWidth,
			height: frame.height * global.maxHeight,
			position: { x: size.width / 2, y: size.height / 2 },
			rotation: 0
		};
		return this.drawInRectangle(graphics, destination, content, rect);
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
