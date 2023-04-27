import { writable } from 'svelte/store';

export const fontsNames = writable([
	'Impact',
	'Lobster',
	'Arial',
	'Helvetica',
	'Next art',
	'Pacifico',
	'Caveat',
	'Comforter'
]);

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
