import { ColorShader } from '$lib/material/color/shader';
import { Gradient4Shader } from '$lib/material/gradient/shader';
import { PatternShader } from '$lib/material/pattern/shader';
import { patternsNames } from '$lib/material/pattern/store';
import type { Rectangle } from './geometry/rectangle';
import { Graphics } from './graphics/graphics';
import { TextStencilService } from './graphics/text_stencil_service';
import type { TextureManager } from './graphics/textures';
import type { TextDrawInfo } from './text/manager';
import type { TextBaseline, TextStyle } from './text/text';

export type TextContent = {
	text: string;
	style: TextStyle;
};
export type Container =
	| {
			type: 'rectangle';
			value: Rectangle;
	  }
	| {
			type: 'global';
			value: {
				// percents
				maxWidth: number;
				maxHeight: number;
				minHeight: number;
			};
	  };
export type Content =
	| {
			type: 'text';
			value: TextContent;
	  }
	| {
			type: 'image';
			value: { id: string };
	  };
export type Block = { id: string; container: Container; content: Content };
export type Frame = { id: string; blocks: Block[]; width: number; height: number };
export type Meme = {
	frames: Frame[];
};

export class FrameDrawer {
	private textService: TextStencilService;
	private graphics: Graphics;
	constructor(readonly gl: WebGL2RenderingContext, readonly textures: TextureManager) {
		this.textService = new TextStencilService(gl);
		this.graphics = new Graphics(gl, textures, {
			color: ColorShader,
			pattern: PatternShader(patternsNames),
			gradient4: Gradient4Shader
		});
	}

	drawFrame(frame: Frame) {
		this.graphics.resize(frame.width, frame.height);
		const gl = this.gl;
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		frame.blocks.forEach((block) => this.drawBlock(frame, block));
	}
	drawBlock(frame: Frame, block: Block) {
		const { graphics, textures } = this;
		const sizes = this.blockSize(frame, block);
		const { container, content } = block;
		switch (content.type) {
			case 'image': {
				const image = textures.get(content.value.id);
				switch (container.type) {
					case 'global': {
						const size = graphics.size;
						graphics.drawRectImage(image.texture, {
							...sizes,
							position: { x: size.width / 2, y: size.height / 2 },
							rotation: 0
						});
						break;
					}
					case 'rectangle': {
						graphics.drawRectImage(image.texture, container.value);
						break;
					}
				}
				break;
			}
			case 'text': {
				const { text, style } = content.value;
				const textStencil = this.textService.getTextStencil(text, style, sizes.width, sizes.height);
				const rect = this.textRectangle(frame, block, sizes, style.baseline, textStencil.info);
				const enableStroke = style.stroke.settings.type !== 'disabled';
				const enableFill = style.fill.settings.type !== 'disabled';
				const channels = (+enableStroke * 1) | (+enableFill * 2);
				if (enableStroke)
					graphics.drawStencilLayer(textStencil.stencil, 1, channels, rect, style.stroke);
				if (enableFill)
					graphics.drawStencilLayer(textStencil.stencil, 2, channels, rect, style.fill);
				break;
			}
		}
	}
	blockSize(frame: Frame, b: Block): { width: number; height: number } {
		const c = b.container;
		const content = b.content;
		if (c.type == 'rectangle') return c.value;
		if (content.type == 'text') {
			const lines = content.value.text.split('\n');
			const linesCount = lines.length;
			const symbolsCount = Math.max(...lines.map((l) => l.length));
			return {
				width: frame.width * c.value.maxWidth,
				height:
					frame.height *
					Math.max(
						c.value.minHeight,
						Math.min(
							c.value.maxHeight,
							linesCount * (0.175 + Math.max(-0.05, 0.03 * (2.5 - symbolsCount / 10)))
						)
					)
			};
		}
		return {
			width: frame.width * c.value.maxWidth,
			height: frame.height * c.value.maxHeight
		};
	}
	textRectangle(
		frame: Frame,
		block: Block,
		size: { width: number; height: number },
		baseline: TextBaseline,
		stencilInfo: TextDrawInfo
	): Rectangle {
		const c = block.container;
		if (c.type == 'rectangle') return c.value;
		const fontShift = 2 / 9;
		const verticalShift = size.height / 2 + stencilInfo.fontSize * fontShift;
		const y =
			baseline == 'top'
				? verticalShift
				: baseline == 'middle'
				? frame.height / 2
				: frame.height - verticalShift;
		return {
			...size,
			rotation: 0,
			position: { x: frame.width / 2, y }
		};
	}
}
