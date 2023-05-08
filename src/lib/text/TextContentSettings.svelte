<script lang="ts">
	import type { TextContent } from '$lib/meme';
	import TextEditor from './TextEditor.svelte';
	export let content: TextContent;
</script>

<TextEditor on:change bind:text={content.text} bind:style={content.style} on:addPattern />
