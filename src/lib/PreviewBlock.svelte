<script lang="ts">
	import type { Block, Content } from './meme';
	import { fontSettingsToCSS } from './text/font';
	import IconText from './base/icons/IconText.svelte';
	import { IconPhoto } from '@tabler/icons-svelte';

	export let value: Block;

	let content: Content;
	$: content = value.content;
</script>

<article>
	<section>
		{#if content.type === 'text'}
			<IconText />
			<span style={`font:${fontSettingsToCSS(content.value.style.font, 16)};`}>
				{content.value.text}
			</span>
		{:else if content.type === 'image'}
			<IconPhoto /> <span>{content.value.name}</span>
		{:else}
			{value.content.type}
		{/if}
	</section>
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
	section {
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
