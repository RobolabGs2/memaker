import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { argv } from 'node:process';

const pathToSave = argv[2];

if (!existsSync('./docs.gl')) {
	const docsglGit = `https://github.com/BSVino/docs.gl.git`;
	execSync(`git clone ${docsglGit}`);
}
const dirName = 'docs.gl/el3';
const dir = readdirSync(dirName);

type Var = {
	type: string;
	mod?: string;
	name: string;
	opt?: boolean;
};
type Signature = [string, Var[]];
type FuncDeclaration = {
	name: string;
	signatures: Signature[];
	params: Record<string, string>;
	detail: string;
	info: string;
};
type FlatFuncDeclaration = [string, Signature[], Record<string, string>, string, string];

function parseType(raw: string): string {
	if (raw === 'genType') return 'T';
	if (raw === 'genBType') return 'TBool';
	if (raw === 'genIType') return 'TInt';
	return raw;
}

const funcs: FlatFuncDeclaration[] = [];
for (const filename of dir) {
	const f = readFileSync(`${dirName}/${filename}`);
	const content = parse(f.toString());
	const nameAndDesc = content.querySelector('div.refnamediv > p');
	if (!nameAndDesc) {
		console.warn(filename);
		continue;
	}
	const [name, brief] = nameAndDesc.text.split(' — ');
	if (name.indexOf(',') != -1) {
		console.warn(filename, name);
		continue;
	}
	const [minVersion, maxVersion] = (() => {
		const table = content.querySelector('.informaltable > table')!;
		const versions = table
			.getElementsByTagName('thead')[0]
			.getElementsByTagName('tr')[1]
			.getElementsByTagName('th')
			.slice(1)
			.map((th) => (+th.text.trim() * 100) | 0);
		const checks = table
			.getElementsByTagName('tbody')[0]
			.getElementsByTagName('tr')[0]
			.getElementsByTagName('td')
			.slice(1)
			.map((x) => x.text === '✔');
		return [versions[checks.indexOf(true)], versions[checks.lastIndexOf(true)]];
	})();
	if (minVersion > 300 || maxVersion < 300) continue;
	const declarationsDivs = content.querySelectorAll('.funcprototype-table');
	if (!declarationsDivs) continue;

	const sigs: Signature[] = declarationsDivs.map((x) => {
		const text = x.text.replace(/[\n\t\r ]+/g, ' ').trim();
		const [r, ...other] = text.split(' ');
		const args = other
			.join(' ')
			.match(/\(([^)]+)\)/)![1]
			.split(',')
			.map((v) => {
				v = v.trim();
				const optional = v.startsWith('[') || undefined;
				if (optional) {
					v = v.substring(1, v.length - 1);
				}
				const [name, type, ...mods] = v.split(' ').reverse();
				const mod = mods?.join(' ') || undefined;
				return { name, type: parseType(type), mod, opt: optional } as Var;
			});
		return [parseType(r), args];
	});

	const paramsList = content.querySelector('dl.variablelist');
	if (!paramsList) {
		continue;
	}
	const params: Record<string, string> = (() => {
		const names = paramsList.querySelectorAll('em.parameter').map((x) => x.text.trim());
		const desc = paramsList.querySelectorAll('dd > p').map((x) => x.text.trim());
		return Object.fromEntries(names.map((x, i) => [x, desc[i]]));
	})();

	const info = content.querySelector('#description')!;
	info.removeChild(info.firstElementChild!);
	for (const link of info.querySelectorAll('a')) {
		link.replaceWith(...link.childNodes);
	}
	// <mfenced open="[" close="]"><mrow><mo>−</mo><mi>π</mi></mrow><mi>π</mi></mfenced>
	for (const fence of info.querySelectorAll('mfenced')) {
		const open = new parse.HTMLElement('mo', {});
		open.innerHTML = fence.getAttribute('open')!;
		const close = new parse.HTMLElement('mo', {});
		close.innerHTML = fence.getAttribute('close')!;
		const replace = new parse.HTMLElement('mrow', {});
		replace.append(open, fence.children[0]);
		const comma = new parse.HTMLElement('mo', {});
		comma.innerHTML = fence.getAttribute('separators')?.at(0) || ',';
		for (const child of fence.children) {
			replace.append(comma.clone(), child);
		}
		replace.append(close);
		fence.replaceWith(replace);
	}
	funcs.push([name, sigs, params, brief, info.innerHTML.trim()]);
}

writeFileSync(pathToSave, JSON.stringify(funcs));
