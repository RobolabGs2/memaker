import { deepCopy, deepEqual } from '$lib/state';
import { fontSettingsToCSS } from '$lib/text/font';
import type { TextManager, TextDrawInfo, TextMeasureContext } from '$lib/text/manager';
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
	}
	private cache = new TextTextureCache();
	private ctx: CanvasRenderingContext2D;

	tick() {
		this.cache.tick();
	}
	clear() {
		this.cache.clear(this.gl);
	}
	getTextStencil(
		text: string,
		style: TextStyle,
		width: number,
		height: number,
		ctx: TextMeasureContext
	): { stencil: WebGLTexture; info: TextDrawInfo } {
		const properties = { text, style, width, height, ctx };
		const cached = this.cache.get(properties);
		if (cached) {
			return cached;
		}

		const w = Math.ceil(Math.abs(width));
		const h = Math.ceil(Math.abs(height));
		const drawInfo = this.textManager.drawTextInfo(text, style, w, h, ctx);

		const canvas = this.ctx.canvas;
		if (canvas.height != h) canvas.height = h;
		if (canvas.width != w) canvas.width = w;
		this.ctx.clearRect(0, 0, w, h);
		this.draw(this.ctx, drawInfo);

		const gl = this.gl;
		const texture = this.cache.expiredTextures.pop() || gl.createTexture();
		if (!texture) {
			throw new Error('Failed to create WebGL texture in TextStencilService.');
		}
		twgl.setTextureFromElement(gl, texture, canvas, {
			wrap: gl.CLAMP_TO_EDGE,
			min: gl.LINEAR
		});
		this.cache.set(properties, texture, drawInfo);
		return { stencil: texture, info: drawInfo };
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

class TableCell {
	constructor(
		readonly properties: {
			text: string;
			style: TextStyle;
			width: number;
			height: number;
			ctx: TextMeasureContext;
		},
		readonly stencil: WebGLTexture,
		readonly info: TextDrawInfo
	) {}
	lastUsage = 0;

	cacheEquals(other: TableCell['properties']): boolean {
		const self = this.properties;
		return (
			self.height === other.height &&
			self.width == other.width &&
			self.style.lineSpacing == other.style.lineSpacing &&
			self.style.case === other.style.case &&
			self.style.align == other.style.align &&
			self.style.baseline == other.style.baseline &&
			self.style.strokeWidth == other.style.strokeWidth &&
			deepEqual(self.style.font, other.style.font) &&
			deepEqual(self.style.fontSizeStrategy, other.style.fontSizeStrategy) &&
			(self.style.fontSizeStrategy.type !== 'relative' ||
				(self.ctx.frame.height === other.ctx.frame.height &&
					self.ctx.frame.width === other.ctx.frame.width)) &&
			(self.style.stroke.settings.type === 'disabled') ===
				(other.style.stroke.settings.type === 'disabled')
		);
	}
}

class TextTextureCache {
	time = 1;
	table: Record<string, TableCell[]> = Object.create(null);
	get(
		properties: TableCell['properties']
	): { stencil: WebGLTexture; info: TextDrawInfo } | undefined {
		const row = this.table[properties.text];
		if (row === undefined) return undefined;
		const cell = row.find((c) => c.cacheEquals(properties));
		if (cell === undefined) return undefined;
		cell.lastUsage = this.time;
		return cell;
	}
	set(properties: TableCell['properties'], stencil: WebGLTexture, info: TextDrawInfo): void {
		let row = this.table[properties.text];
		if (row === undefined) {
			row = [];
			this.table[properties.text] = row;
		}
		const cell = new TableCell(deepCopy(properties), stencil, info);
		cell.lastUsage = this.time;
		row.push(cell);
	}
	expiredTextures = new Array<WebGLTexture>();
	tick() {
		for (const text in this.table) {
			const row = this.table[text];
			for (let i = 0; i < row.length; i++) {
				const cur = row[i];
				if (cur.lastUsage == this.time) {
					continue;
				}
				const lastI = row.length - 1;
				if (i !== lastI) {
					row[i] = row[lastI];
				}
				row.pop();
				--i;
				this.expiredTextures.push(cur.stencil);
			}
			if (row.length === 0) {
				delete this.table[text];
			}
		}
		this.time++;
	}
	clear(gl: WebGL2RenderingContext) {
		for (const text in this.table) {
			const row = this.table[text];
			for (const cell of row) gl.deleteTexture(cell.stencil);
		}
		this.table = Object.create(null);
	}
}
