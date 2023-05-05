import { isSkinsMap, type FileImport } from '$lib/memaker';

function parseFilepath([origin, path]: [string, string]) {
	const pathParts = origin.split('/');
	let filename = pathParts[pathParts.length - 1];
	filename = filename.slice(0, filename.lastIndexOf('.'));
	const url = path;
	return { name: filename, url };
}

function images(imports: Record<string, string>) {
	return Object.entries(imports).map(parseFilepath);
}

const patternUrls = images(
	import.meta.glob('$lib/resources/patterns/*.{png,jpg,jpeg,PNG,JPEG}', {
		eager: true,
		as: 'url'
	})
);

const placeholdersUrls = Object.entries(
	import.meta.glob('$lib/resources/placeholders/**/*.{png,jpg,jpeg,PNG,JPEG}', {
		eager: true,
		as: 'url'
	})
)
	.map(([origin, url]) => {
		const prefix = /placeholders\//.exec(origin);
		if (!prefix) throw Error(`Not found prefix 'placeholder' in '${origin}''`);
		const prefixSize = prefix.index + prefix[0].length;
		const trimmed = origin.substring(prefixSize);
		const [skin, category, filename] = trimmed.split('/');
		const name = filename.slice(0, filename.lastIndexOf('.'));
		return { skin, category, name, url };
	})
	.reduce((acc, file) => {
		acc[file.skin] = acc[file.skin] ?? {};
		acc[file.skin][file.category] = acc[file.skin][file.category] ?? [];
		acc[file.skin][file.category].push(file);
		return acc;
	}, {} as Record<string, Record<string, FileImport[]>>);

if (!isSkinsMap(placeholdersUrls)) {
	throw Error(
		`Incorrect configuration: this is not skins map: ${JSON.stringify(placeholdersUrls)}`
	);
}

export default {
	patternUrls,
	placeholdersUrls
};
