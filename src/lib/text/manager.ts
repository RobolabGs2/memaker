import { fontSettingsToCSS, type FontSettings } from './font';
import {
	type TextMeasurer,
	type TextMeasurements,
	interpolateX,
	FontMetricsStore
} from './metrics';
import { textToCase, type TextAlign, type TextBaseline, type TextStyle } from './text';

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
		this.ctx.font = fontSettingsToCSS(font, fontSize);
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
		private statistics: FontMetricsStore,
		private measurer: TextMeasurer = new CanvasTextMeasurer()
	) {
		measurer.baseline = 'bottom';
	}

	drawTextInfo(text: string, style: TextStyle, width: number, height: number) {
		const formattedText = textToCase(text, style.case).split('\n');
		const strategy = style.fontSizeStrategy;
		switch (strategy.type) {
			case 'same-height':
				return this.drawLinesSameHeight(
					formattedText,
					style.font,
					style.stroke.settings.type == 'disabled' ? 0 : style.strokeWidth / 100,
					style.align,
					style.baseline,
					style.lineSpacing,
					width,
					height
				);
			case 'same-width':
				return this.drawLinesSameWidth(
					formattedText,
					style.font,
					style.stroke.settings.type == 'disabled' ? 0 : style.strokeWidth / 100,
					style.align,
					style.baseline,
					style.lineSpacing,
					width,
					height
				);
			case 'fixed':
				return this.drawLinesFixedSize(
					formattedText,
					strategy.unit == 'pt' ? (strategy.value / 72) * 96 : strategy.value,
					style.font,
					style.stroke.settings.type == 'disabled' ? 0 : style.strokeWidth / 100,
					style.align,
					style.baseline,
					style.lineSpacing,
					width,
					height
				);
		}
		throw new Error(
			`Unknown font size strategy ${style.fontSizeStrategy}: ${JSON.stringify(style, undefined, 2)}`
		);
	}

	fontSize(
		width: number,
		height: number,
		text: string[],
		font: FontSettings,
		strokeWidth: number,
		spacing: number,
		dx = 100
	) {
		if (width < 2 || height < 2) return Math.min(width, height);
		const widestLine = text
			.map((line) => {
				const metrics = this.measurer.measureText(line, font, dx);
				return { line, width: metrics.width };
			})
			.reduce((max, current) => (current.width > max.width ? current : max)).line;

		const xWidthCandidate = this.fillWidthFontSize(width, widestLine, font, strokeWidth, dx);

		const n = text.length;
		const lineHeight = height / (n + spacing * (n - 1)) / (1 + strokeWidth);
		const xHeightCandidate = interpolateX(lineHeight, this.statistics.get(font));
		return Math.min(xHeightCandidate, xWidthCandidate);
	}
	private fillWidthFontSize(
		width: number,
		text: string,
		font: FontSettings,
		strokeWidth: number,
		dx: number
	) {
		const maxLineWidth = strokeWidth * dx;
		const metrics = this.measurer.measureText(text, font, dx);
		const yWidth = metrics.width + maxLineWidth;
		const kWidth = yWidth / dx;
		return width / kWidth;
	}
	heightMeasuresCache = new Map<string, TextMeasurements>();
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
	private drawLinesSameWidth(
		text: string[],
		font: FontSettings,
		strokeWidth: number,
		align: TextAlign,
		baseline: TextBaseline,
		spacing: number,
		maxWidth: number,
		height: number
	): TextDrawInfo {
		let width = maxWidth;

		const lines = new Array<TextLineDrawInfo>();
		this.measurer.align = 'center';
		let totalHeight = height;
		do {
			lines.length = 0;
			width = (width / totalHeight) * height;
			totalHeight = 0;
			let y = 0;
			for (let i = 0; i < text.length; i++) {
				const line = text[i];
				if (!line.length) continue;
				const fontSize = this.fillWidthFontSize(width - 2, line, font, strokeWidth, 100);
				if (!Number.isFinite(fontSize)) continue;
				const lineMetrics = this.measurer.measureText(line, font, fontSize);
				const lineWidth = strokeWidth * fontSize;
				const halfLineWidth = lineWidth / 2;
				const lineHeight = lineMetrics.height + lineWidth + spacing;
				totalHeight += lineHeight;
				const box = lineMetrics.boundingBox;
				y += lineMetrics.boundingBox.top + lineWidth / 2;

				let x = 0;
				switch (align) {
					case 'center':
						x = (maxWidth + box.left - box.right) / 2;
						break;
					case 'left':
						x = halfLineWidth + box.left;
						break;
					case 'right':
						x = maxWidth - (halfLineWidth + box.right);
						break;
				}

				lines.push({ text: line, x, y, fontSize, lineWidth, metrics: lineMetrics });
				y += lineWidth / 2 + spacing + lineMetrics.boundingBox.bottom;
			}
		} while (totalHeight > height && height > 8 && width > 8);
		const shift =
			baseline == 'top'
				? 0
				: baseline == 'middle'
				? ((height - totalHeight) / 2) | 0
				: height - totalHeight;
		let fontSizesSum = 0;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			fontSizesSum += line.fontSize;
			line.y += shift;
		}
		return {
			lines,
			font,
			fontSize: fontSizesSum / lines.length,
			baseline: 'bottom',
			align: 'center'
		} as const;
	}
	private drawLinesSameHeight(
		text: string[],
		font: FontSettings,
		strokeWidth: number,
		align: TextAlign,
		baseline: TextBaseline,
		spacing: number,
		width: number,
		height: number
	): TextDrawInfo {
		const fontSize = this.fontSize(width - 2, height - 2, text, font, strokeWidth, spacing);
		return this.drawLinesFixedSize(
			text,
			fontSize,
			font,
			strokeWidth,
			align,
			baseline,
			spacing,
			width,
			height
		);
	}
	private drawLinesFixedSize(
		text: string[],
		fontSize: number,
		font: FontSettings,
		strokeWidth: number,
		align: TextAlign,
		baseline: TextBaseline,
		spacing: number,
		width: number,
		height: number
	): TextDrawInfo {
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

		const lines = new Array<TextLineDrawInfo>();
		this.measurer.align = align;
		for (let i = 0; i < text.length; i++) {
			const line = text[i];
			const metrics = this.measurer.measureText(line, font, fontSize);
			const box = metrics.boundingBox;
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
			lines.push({ text: line, x, y, lineWidth, fontSize, metrics });
		}
		return {
			lines,
			font,
			fontSize,
			baseline: 'bottom',
			align: align
		} as const;
	}
}

export type TextLineDrawInfo = {
	text: string;
	x: number;
	y: number;
	fontSize: number;
	lineWidth: number;
	metrics: TextMeasurements;
};

export type TextDrawInfo = {
	lines: TextLineDrawInfo[];
	font: FontSettings;
	fontSize: number;
	baseline: TextBaseline;
	align: TextAlign;
};
