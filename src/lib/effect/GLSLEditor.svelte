<script lang="ts" context="module">
	export interface CompilationError {
		line: number;
		message: string;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { Transaction } from '@codemirror/state';
	import {
		completeFromList,
		type Completion,
		autocompletion,
		CompletionContext,
		type CompletionSource
	} from '@codemirror/autocomplete';
	import { indentWithTab } from '@codemirror/commands';
	import { shader } from '@codemirror/legacy-modes/mode/clike';
	import { StreamLanguage } from '@codemirror/language';
	import { oneDark } from '@codemirror/theme-one-dark';
	import { type Diagnostic, setDiagnostics } from '@codemirror/lint';
	import { vscodeKeymap } from '@replit/codemirror-vscode-keymap';

	// TODO: update from outside
	export let text: string;
	export let errors: CompilationError[] = [];
	export let hints: Completion[] = [];
	function errorToDiagnostic(editor: EditorView, err: CompilationError): Diagnostic {
		const line = editor.state.doc.line(err.line);
		return {
			from: line.from+(line.length - line.text.trimStart().length),
			to: line.to,
			severity: 'error',
			message: err.message,
			actions: []
		};
	}
	let editorElem: HTMLElement;
	let editor: EditorView;
	$: editor &&
		editor.dispatch(setDiagnostics(editor.state, errors.map(errorToDiagnostic.bind(null, editor))));
	// $: editor && editor.set

	const language = StreamLanguage.define(shader);
	function dispatchTransactions(trs: readonly Transaction[], view: EditorView) {
		view.update(trs);
		const docChanged = trs.some((t) => t.docChanged);
		if (docChanged) text = view.state.doc.toString();
	}
	let fromList: CompletionSource;
	$: fromList = completeFromList(hints);
	const hitsAutocompletion = autocompletion({
		override: [
			(context: CompletionContext) => {
				return fromList(context);
			}
		]
	});
	onMount(() => {
		editor = new EditorView({
			doc: text,
			extensions: [
				basicSetup,
				keymap.of([indentWithTab]),
				keymap.of(vscodeKeymap),
				language,
				hitsAutocompletion,
				oneDark
			],
			parent: editorElem,
			dispatchTransactions
		});
		return () => editor.destroy();
	});
</script>

<article bind:this={editorElem} />
