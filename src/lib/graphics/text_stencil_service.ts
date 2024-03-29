import { fontSettingsToCSS } from '$lib/text/font';
import type { TextManager, TextDrawInfo } from '$lib/text/manager';
import type { TextStyle } from '$lib/text/text';
import * as twgl from 'twgl.js';

export interface TextStencilDebugSettings {
	drawStencilBorder: boolean;
	drawBaseline: boolean;
	drawLineBorder: boolean;
}

export class TextStencilService {
	constructor(
		readonly gl: WebGL2RenderingContext,
		private readonly textManager: TextManager,
		public debugSettings: TextStencilDebugSettings = {
			drawBaseline: false,
			drawLineBorder: false,
			drawStencilBorder: false
		},
		ctx = document.createElement('canvas').getContext('2d')
	) {
		if (!ctx) throw new Error('TextStencilService require not null ctx: CanvasRenderingContext2D.');
		this.ctx = ctx;
		const texture = gl.createTexture();
		if (!texture) throw new Error('Failed to create WebGL texture in TextStencilService.');
		this.stencilTexture = texture;
	}
	// TODO: cache textures
	private stencilTexture: WebGLTexture;
	private ctx: CanvasRenderingContext2D;

	getTextStencil(
		text: string,
		style: TextStyle,
		width: number,
		height: number
	): { stencil: WebGLTexture; info: TextDrawInfo } {
		const w = Math.ceil(Math.abs(width));
		const h = Math.ceil(Math.abs(height));
		const drawInfo = this.textManager.drawTextInfo(text, style, w, h);

		const canvas = this.ctx.canvas;
		if (canvas.height != h) canvas.height = h;
		if (canvas.width != w) canvas.width = w;
		this.ctx.clearRect(0, 0, w, h);
		this.draw(this.ctx, drawInfo);

		const gl = this.gl;
		twgl.setTextureFromElement(gl, this.stencilTexture, canvas, {
			wrap: gl.CLAMP_TO_EDGE,
			min: gl.LINEAR
		});
		return { stencil: this.stencilTexture, info: drawInfo };
	}
	draw(ctx: CanvasRenderingContext2D, drawInfo: TextDrawInfo) {
		ctx.lineJoin = 'round';
		ctx.miterLimit = 2;
		ctx.textAlign = drawInfo.align;
		ctx.textBaseline = drawInfo.baseline;

		ctx.strokeStyle = '#ff0000';
		ctx.fillStyle = '#00ff00';

		const lines = drawInfo.lines;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			ctx.font = fontSettingsToCSS(drawInfo.font, line.fontSize);
			ctx.lineWidth = line.lineWidth;
			ctx.strokeText(line.text, line.x, line.y);
		}
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			ctx.font = fontSettingsToCSS(drawInfo.font, line.fontSize);
			ctx.fillText(line.text, line.x, line.y);
		}
		if (
			this.debugSettings.drawBaseline ||
			this.debugSettings.drawLineBorder ||
			this.debugSettings.drawStencilBorder
		) {
			if (this.debugSettings.drawStencilBorder) {
				ctx.lineWidth = 3;
				ctx.strokeStyle = '#0aaaaa';
				ctx.strokeRect(0, 0, ctx.canvas.width, ctx.canvas.height);
				ctx.beginPath();
				ctx.moveTo(ctx.canvas.width / 2, 0);
				ctx.lineTo(ctx.canvas.width / 2, ctx.canvas.height);
				ctx.stroke();
				ctx.beginPath();
				ctx.moveTo(0, ctx.canvas.height / 2);
				ctx.lineTo(ctx.canvas.width, ctx.canvas.height / 2);
				ctx.stroke();
			}
			ctx.lineWidth = 1;
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i];
				const cy = line.y;
				const cx = line.x;
				ctx.font = fontSettingsToCSS(drawInfo.font, line.fontSize);
				const metrics = ctx.measureText(line.text);
				if (this.debugSettings.drawBaseline) {
					ctx.beginPath();
					ctx.moveTo(0, cy);
					ctx.lineTo(ctx.canvas.width, cy);
					ctx.strokeStyle = '#ff0000';
					ctx.stroke();
					ctx.beginPath();
					ctx.moveTo(cx, cy - metrics.actualBoundingBoxAscent);
					ctx.lineTo(cx, cy + metrics.actualBoundingBoxDescent);
					ctx.stroke();
				}
				if (this.debugSettings.drawLineBorder) {
					ctx.strokeStyle = '#00ff00';
					ctx.strokeRect(
						cx - metrics.actualBoundingBoxLeft,
						cy - metrics.actualBoundingBoxAscent,
						metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
						metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
					);
				}
			}
		}
	}
}
