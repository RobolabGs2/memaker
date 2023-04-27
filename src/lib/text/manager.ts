import { fontSettingsToCSS, type FontSettings } from './font';
import { textToCase, type TextAlign, type TextBaseline, type TextStyle } from './text';

export interface TextMeasurements {
	advancedWidth: number;
	width: number;
	height: number;
	boundingBox: {
		top: number;
		bottom: number;
		left: number;
		right: number;
	};
}
export interface TextMeasurer {
	baseline: TextBaseline;
	align: TextAlign;
	measureText(text: string, font: FontSettings, fontSize: number): TextMeasurements;
}

export class CanvasTextMeasurer implements TextMeasurer {
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	constructor(private readonly ctx = document.createElement('canvas').getContext('2d')!) {}

	set baseline(value: TextBaseline) {
		this.ctx.textBaseline = value;
	}
	get baseline() {
		return this.ctx.textBaseline;
	}
	set align(value: TextAlign) {
		this.ctx.textAlign = value;
	}
	get align() {
		return this.ctx.textAlign;
	}
	measureText(text: string, font: FontSettings, fontSize: number): TextMeasurements {
		if (fontSize && font) {
			this.ctx.font = fontSettingsToCSS(font, fontSize);
		}
		const metrics = this.ctx.measureText(text);
		return {
			advancedWidth: metrics.width,
			width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
			height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
			boundingBox: {
				top: metrics.actualBoundingBoxAscent,
				bottom: metrics.actualBoundingBoxDescent,
				left: metrics.actualBoundingBoxLeft,
				right: metrics.actualBoundingBoxRight
			}
		};
	}
}

export class TextManager {
	private static MAX_HEIGHT_TEXT_EXAMPLE =
		'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzАаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя';

	constructor(
		private measurer: TextMeasurer = new CanvasTextMeasurer(),
		public interpolationPoint = 100
	) {
		measurer.baseline = 'bottom';
	}

	drawTextInfo(text: string, style: TextStyle, width: number, height: number) {
		const formattedText = textToCase(text, style.case).split('\n');
		const drawInfo = this.drawLinesInfo(
			formattedText,
			style.font,
			style.strokeWidth / 100,
			style.align,
			style.baseline,
			style.lineSpacing,
			width,
			height
		);
		return drawInfo;
	}

	private fontSize(
		width: number,
		height: number,
		text: string[],
		font: FontSettings,
		strokeWidth: number,
		dx: number,
		spacing: number
	) {
		if (width < 2 || height < 2) return Math.min(width, height);
		const widestLine = text
			.map((line) => {
				const metrics = this.measurer.measureText(line, font, dx);
				return { line, width: metrics.width };
			})
			.reduce((max, current) => (current.width > max.width ? current : max)).line;

		const maxLineWidth = strokeWidth * dx;

		const lineHeight = this.measureHeight(font, dx) + maxLineWidth / 2;
		const yHeight = this.linesHeight(lineHeight, text.length, spacing) + maxLineWidth / 2;
		const kHeight = yHeight / dx;

		const metrics = this.measurer.measureText(widestLine, font, dx);
		const yWidth = metrics.width + maxLineWidth;
		const kWidth = yWidth / dx;

		const xWidthCandidate = width / kWidth;
		const xHeightCandidate = height / kHeight;

		return Math.min(xHeightCandidate, xWidthCandidate);
	}
	heightMeasuresCache = new Map<string, TextMeasurements>();
	private measureHeight(font: FontSettings, fontSize: number): number {
		return this.measureReference(font, fontSize).height;
	}
	private measureReference(font: FontSettings, fontSize: number): TextMeasurements {
		const cacheKey = fontSettingsToCSS(font, fontSize);
		const cached = this.heightMeasuresCache.get(cacheKey);
		if (cached) return cached;
		const metrics = this.measurer.measureText(TextManager.MAX_HEIGHT_TEXT_EXAMPLE, font, fontSize);
		this.heightMeasuresCache.set(cacheKey, metrics);
		return metrics;
	}
	private linesHeight(lineHeight: number, linesCount: number, spacing: number) {
		return lineHeight * (linesCount + spacing * (linesCount - 1));
	}
	private drawLinesInfo(
		text: string[],
		font: FontSettings,
		strokeWidth: number,
		align: TextAlign,
		baseline: TextBaseline,
		spacing: number,
		width: number,
		height: number
	) {
		const fontSize = this.fontSize(
			width - 2,
			height - 2,
			text,
			font,
			strokeWidth,
			this.interpolationPoint,
			spacing
		);
		const lineWidth = strokeWidth * fontSize;
		const halfLineWidth = lineWidth / 2;
		const baseX =
			align == 'left' ? halfLineWidth : align == 'right' ? width - halfLineWidth : (width / 2) | 0;
		const lineMetrics = this.measureReference(font, fontSize);
		const lineHeight = lineMetrics.height + lineWidth / 2;
		const dy = lineHeight * (1 + spacing);
		const totalHeight = this.linesHeight(lineHeight, text.length, spacing) + lineWidth / 2;
		const shift =
			baseline == 'top'
				? 0
				: baseline == 'middle'
				? ((height - totalHeight) / 2) | 0
				: height - totalHeight;
		const startY = lineHeight + shift - lineMetrics.boundingBox.bottom;

		const lines = new Array<{ text: string; x: number; y: number }>();
		this.measurer.align = align;
		for (let i = 0; i < text.length; i++) {
			const line = text[i];
			const box = this.measurer.measureText(line, font, fontSize).boundingBox;
			const y = startY + i * dy;
			let x = baseX;
			switch (align) {
				case 'center':
					x += (box.left - box.right) / 2;
					break;
				case 'left':
					x += box.left;
					break;
				case 'right':
					x -= box.right;
					break;
			}
			lines.push({ text: line, x, y });
		}
		return {
			lines,
			font,
			fontSize,
			lineWidth,
			stringHeight: lineHeight,
			totalHeight,
			baseline: 'bottom',
			align: align
		} as const;
	}
}

export type TextDrawInfo = ReturnType<TextManager['drawLinesInfo']>;
