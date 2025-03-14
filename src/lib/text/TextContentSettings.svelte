<script lang="ts">
	import type { Container, TextContent } from '$lib/meme';
	import TextEditor from './TextEditor.svelte';
	export let content: TextContent;
	export let container: Container;
</script>

<TextEditor
	on:change
	bind:text={content.text}
	bind:style={content.style}
	{container}
	on:addPattern
/>
