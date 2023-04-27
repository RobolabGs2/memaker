<script lang="ts">
	import type { TextContent } from '$lib/meme';
	import { fontSettingsToCSS } from './font';

	export let content: TextContent;
</script>

<article>
	<main style="font:{fontSettingsToCSS(content.style.font, 16)};">
		<div>
			{content.text}
		</div>
	</main>
	<slot />
</article>

<style lang="scss">
	article {
		width: 100%;
	}
	main {
		height: 32px;
		max-width: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 8px;
		& > div {
			text-align: center;
			vertical-align: text-bottom;
			white-space: nowrap;
			text-overflow: ellipsis;
			overflow: hidden;
		}
	}
</style>
