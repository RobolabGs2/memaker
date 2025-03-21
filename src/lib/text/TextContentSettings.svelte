<script lang="ts">
	import type { Container, TextContent } from '$lib/meme';
	import TextEditor from './TextEditor.svelte';
	export let content: TextContent;
	export let container: Container;
	import type { RawShader } from '$lib/graphics/shader';

	export let shaders: Record<string, RawShader>;
	export let context: { frame: { width: number; height: number } };
</script>

<TextEditor
	on:change
	bind:text={content.text}
	bind:style={content.style}
	{container}
	{shaders}
	{context}
	on:addPattern
/>
