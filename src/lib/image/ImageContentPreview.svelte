<script lang="ts">
	import type { ImageContent } from '.';
	import { IconPhoto } from '@tabler/icons-svelte';
	export let content: ImageContent;
</script>

<article>
	<main>
		<IconPhoto /> <span>{content.name}</span>
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

		span {
			margin-left: 4px;
		}
	}
</style>
