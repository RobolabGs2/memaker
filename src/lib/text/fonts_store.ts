import JSZip from 'jszip';
import { writable } from 'svelte/store';
import fontStatisticsZip from './fonts_metrics.zip';
import {
	FontMetricsStore,
	fontFamilyStatistics,
	fontStatisticsFromCSV,
	fontStatisticsToInterpolationData,
	type TextMeasurer
} from './metrics';

export const fontsNames = writable([
	'Impact',
	'Lobster',
	'Arial',
	'Helvetica',
	'Next art',
	'Pacifico',
	'Caveat',
	'Comforter',
	'Raleway'
]);

export function loadFontStatisticsCSV(url: string) {
	const store = new FontMetricsStore();
	return {
		store,
		then: fetch(url)
			.then((r) => r.blob())
			.then((blob) => JSZip.loadAsync(blob))
			.then((zip) => {
				return Promise.all(
					Object.entries(zip.files).map(([name, zip]) => {
						return zip
							.async('string')
							.then(
								(csv) =>
									[name.substring(0, name.length - '.csv'.length), preprocessCSV(csv)] as const
							);
					})
				);
			})
			.then((pairs) => (store.data = new Map(pairs)))
	};
}
export function loadFontStatistics() {
	return loadFontStatisticsJSON(fontStatisticsZip);
}
export function loadFontStatisticsJSON(url: string) {
	const store = new FontMetricsStore();
	return {
		store,
		then: fetch(url)
			.then((r) => r.blob())
			.then((blob) => JSZip.loadAsync(blob))
			.then((zip) => {
				return Promise.all(
					Object.entries(zip.files).map(([name, zip]) => {
						return zip
							.async('string')
							.then(
								(json) =>
									[name.substring(0, name.length - '.json'.length), JSON.parse(json)] as const
							);
					})
				);
			})
			.then((pairs) => (store.data = new Map(pairs)))
	};
}

function preprocessCSV(statisticsCSV: string) {
	const s = fontStatisticsFromCSV(statisticsCSV);
	return fontStatisticsToInterpolationData(s);
}

export function forceLoadFonts(fontsSet = document.fonts): Promise<FontFace[]> {
	const fontsPromises = new Array<Promise<FontFace>>();
	fontsSet.forEach((f) =>
		fontsPromises.push(
			f.load().catch((err) => {
				console.warn(`Failed load font ${f.family}: ${err.message}`);
				return f;
			})
		)
	);
	return Promise.all(fontsPromises);
}

export function prepareFontFamilyInterpolationDataZIP(measurer: TextMeasurer, family: string) {
	const zip = JSZip();
	fontFamilyStatistics(measurer, family).forEach((s) =>
		zip.file(`${s.name}.json`, JSON.stringify(fontStatisticsToInterpolationData(s.data)))
	);
	return zip.generateAsync({ compression: 'DEFLATE', type: 'blob' });
}
