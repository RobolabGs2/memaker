import rawData from './glsl_funcs.json';
import { type Completion, type CompletionInfo, type CompletionSection } from '@codemirror/autocomplete';

type Var = {
	type: string;
	mod?: string;
	name: string;
	opt?: boolean;
};
type Signature = [string, Var[]];
type FlatFuncDeclaration = [string, Signature[], Record<string, string>, string, string];

export class GLSLFuncCompletion implements Completion {
	signatures: Signature[];
	params: Record<string, string>;
	constructor(raw: FlatFuncDeclaration) {
		const info = document.createElement('article');
		[this.label, this.signatures, this.params, this.detail, info.innerHTML] = raw;
		this.detail = `(${this.signatures[0][1].map(v => `${v.type} ${v.name}`).join(", ")}): ${this.signatures[0][0]} — ${this.detail}`
		this.info = () => {
			return info;
		};
	}
	detail: string;
	label: string;

	info: (completion: Completion) => CompletionInfo;
	readonly type = 'function';
	section = "functions";
}

export const GLSLES3Functions = rawData.map(
	(data) => new GLSLFuncCompletion(data as FlatFuncDeclaration)
);
