import type { FontSettings } from './font';
import type { TextBaseline, TextAlign } from './text';

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

export function fontStatisticsToCSV(data: FontStatistics) {
	const names = Object.keys(data);
	const cols = Object.values(data);
	const rows = [names.join(',')];
	for (let i = 0; i < cols[0].length; i++) {
		const row = cols.map((col) => col[i]);
		rows.push(row.join(','));
	}
	return rows.join('\n');
}

export function fontStatisticsFromCSV(data: string): FontStatistics {
	const [names, ...rows] = data.split('\n');
	const keys = names.split(',');
	const values = new Array(keys.length).fill(1).map(() => new Array<unknown>());
	for (const row of rows) {
		const cells = row.split(',');
		cells.forEach((cell, i) => {
			const asNumber = Number(cell);
			values[i].push(Number.isNaN(asNumber) ? cell : asNumber);
		});
	}
	return Object.fromEntries(keys.map((key, i) => [key, values[i]])) as FontStatistics;
}

export type FontMetrics = ReturnType<typeof fontStatisticsToInterpolationData>;
export function fontStatisticsToInterpolationData(data: FontStatistics) {
	const rows = data.fontSize.length;
	const dx = data.fontSize[rows - 1];
	const dy = data.height[rows - 1];
	const k = dy / dx;
	const size = [];
	const height = [];
	let prev = -1;
	for (let i = 0; i < rows; i++) {
		const [x, y] = [data.fontSize[i], data.height[i]];
		if (prev < y && x <= 256) {
			prev = y;
			size.push(x);
			height.push(y);
		}
	}
	return {
		metrics: { size, height },
		k
	};
}

export function interpolateX(y: number, metrics: FontMetrics) {
	if (y > metrics.k * 256) return y / metrics.k;
	const { size, height } = metrics.metrics;
	let l = 0,
		r = size.length - 1;
	while (r - l > 1) {
		const mid = Math.round((l + r) / 2);

		if (height[mid] <= y) l = mid;
		else if (height[mid] > y) r = mid;
	}
	return size[l];
}

export type FontStatistics = ReturnType<typeof fontStatistics>;

export function fontStatistics(
	measurer: TextMeasurer,
	family: string,
	bold: boolean,
	italic: boolean,
	smallCaps: boolean
) {
	const testStr =
		'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZzАаБбВвГгДдЕеЁёЖжЗзИиЙйКкЛлМмНнОоПпРрСсТтУуФфХхЦцЧчШшЩщЪъЫыЬьЭэЮюЯя';
	const fontSize = new Array<number>();
	const height = new Array<number>();
	/** - `c` - close
	 * - `o` - open
	 * - `-` - continue
	 */
	const meta = new Array<'c' | 'o' | '-'>();
	let prevY = 0;
	for (let x = 1; x <= 256.1; x += 0.1) {
		x = Math.round(x * 1000) / 1000;
		const lx = x - 0.05;
		const rx = x + 0.05;
		const [ly, y, ry] = [lx, x, rx].map(
			(size) => measurer.measureText(testStr, { family, bold, italic, smallCaps }, size).height
		);
		if (Math.abs(ly - y) > 0.5) {
			fontSize.push(x, x);
			meta.push('o', 'c');
			height.push(ly, y);
			prevY = y;
		} else if (Math.abs(ry - y) > 0.5) {
			fontSize.push(x, x);
			meta.push('c', 'o');
			height.push(y, ry);
			prevY = ry;
		} else if (prevY != y) {
			fontSize.push(x);
			meta.push('-');
			height.push(y);
			prevY = y;
		}
	}
	{
		const x = 300;
		const y = measurer.measureText(testStr, { family, bold, italic, smallCaps }, x).height;
		fontSize.push(x);
		meta.push('-');
		height.push(y);
	}
	return { fontSize, height, meta };
}

export function fontSettingsToKey(font: FontSettings, separator = '_'): string {
	const { family, italic, bold, smallCaps } = font;
	const nameParts = [family];
	if (italic) nameParts.push('italic');
	if (bold) nameParts.push('bold');
	if (smallCaps) nameParts.push('small-caps');
	return nameParts.join(separator);
}

export function fontFamilyStatistics(measurer: TextMeasurer, family: string) {
	const statistics = [];
	for (const italic of [false, true])
		for (const smallCaps of [false, true])
			for (const bold of [false, true]) {
				const name = fontSettingsToKey({ family, italic, smallCaps, bold });
				const m = fontStatistics(measurer, family, bold, italic, smallCaps);
				statistics.push({
					data: m,
					name
				});
			}
	return statistics;
}

export function fontVariations(family: string): FontSettings[] {
	const variations = new Array<FontSettings>();
	for (const italic of [false, true])
		for (const smallCaps of [false, true])
			for (const bold of [false, true]) variations.push({ family, italic, smallCaps, bold });
	return variations;
}

export class FontMetricsStore {
	data?: Map<string, FontMetrics>;
	get(font: FontSettings): FontMetrics {
		if (!this.data)
			return {
				k: 1 / 256,
				metrics: {
					height: [0, 1],
					size: [0, 1]
				}
			};
		const key = fontSettingsToKey(font);
		const statistics = this.data.get(key);
		if (!statistics) throw new Error(`Not found font statistics for ${key}`);
		return statistics;
	}
}
