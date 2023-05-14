<script lang="ts">
	import type { TextContent } from '$lib/meme';
	import { fontSettingsToCSS } from './font';

	export let content: TextContent;
</script>

<article>
	<main style="font:{fontSettingsToCSS(content.style.font, 16)};">
		{content.text}
	</main>
	<slot />
</article>

<style lang="scss">
	article {
		width: 100%;
		max-width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-left: 4px;
	}
	main {
		height: 32px;
		display: flex;
		align-items: center;
		padding: 8px;
		text-align: center;
		vertical-align: text-bottom;
		white-space: nowrap;
		text-overflow: ellipsis;
		overflow: hidden;
	}
</style>
