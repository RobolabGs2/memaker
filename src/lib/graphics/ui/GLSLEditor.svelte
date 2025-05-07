<script lang="ts" context="module">
	export interface CompilationError {
		line: number;
		message: string;
	}
	const outsideReplace = Annotation.define();
	function errorToDiagnostic(editor: EditorView, err: CompilationError): Diagnostic {
		const line = editor.state.doc.line(err.line);
		return {
			from: line.from + (line.length - line.text.trimStart().length),
			to: line.to,
			severity: 'error',
			message: err.message,
			actions: []
		};
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { basicSetup } from 'codemirror';
	import { EditorView, keymap } from '@codemirror/view';
	import { Transaction, type TransactionSpec, Annotation } from '@codemirror/state';
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

	export let text: string;
	export let errors: CompilationError[] = [];
	export let hints: Completion[] = [];

	let editorElem: HTMLElement;
	let editor: EditorView;
	let fromList: CompletionSource;

	$: fromList = completeFromList(hints);
	$: editor &&
		editor.dispatch(setDiagnostics(editor.state, errors.map(errorToDiagnostic.bind(null, editor))));

	$: {
		if (editor && text !== editor.state.doc.toString()) {
			editor.dispatch({
				changes: { from: 0, to: editor.state.doc.length, insert: text },
				annotations: outsideReplace.of(undefined)
			} as TransactionSpec);
		}
	}

	onMount(() => {
		const language = StreamLanguage.define(shader);
		function dispatchTransactions(trs: readonly Transaction[], view: EditorView) {
			view.update(trs);
			const docChanged = trs.some((t) => t.docChanged && !t.annotation(outsideReplace));
			if (docChanged) text = view.state.doc.toString();
		}
		const hitsAutocompletion = autocompletion({
			closeOnBlur: false,
			override: [
				(context: CompletionContext) => {
					return fromList(context);
				}
			]
		});
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
