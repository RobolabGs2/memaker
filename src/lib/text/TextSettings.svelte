<script lang="ts">
	import ToggleButton from '$lib/base/ToggleButton.svelte';
	import Select from '$lib/base/Select.svelte';
	import type { FontSettings } from './font';
	import { fontsNames } from './fonts_store';
	import type { TextAlign, TextBaseline, TextCase } from './text';
	import {
		IconAlignLeft,
		IconAlignCenter,
		IconAlignRight,
		IconAlignBoxBottomCenter,
		IconAlignBoxCenterMiddle,
		IconAlignBoxTopCenter,
		IconItalic,
		IconBold,
		IconLineHeight
	} from '@tabler/icons-svelte';
	import DropDown from '$lib/base/DropDown.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';

	export let font: FontSettings;
	export let textCase: TextCase;
	export let align: TextAlign;
	export let baseline: TextBaseline;
	export let spacing: number;
</script>

<article>
	<ToggleButton bind:value={font.italic} on:change><IconItalic size={16} /></ToggleButton>
	<ToggleButton bind:value={font.bold} on:change><IconBold size={16} /></ToggleButton>
	<ToggleButton bind:value={font.smallCaps} on:change>Small Caps</ToggleButton>
	<Select bind:value={align} items={['left', 'center', 'right']} on:change let:item>
		{#if item == 'left'}
			<IconAlignLeft />
		{:else if item == 'center'}
			<IconAlignCenter />
		{:else if item == 'right'}
			<IconAlignRight />
		{/if}
	</Select>
	<Select bind:value={baseline} items={['top', 'middle', 'bottom']} on:change let:item>
		{#if item == 'top'}
			<IconAlignBoxTopCenter />
		{:else if item == 'middle'}
			<IconAlignBoxCenterMiddle />
		{:else if item == 'bottom'}
			<IconAlignBoxBottomCenter />
		{/if}
	</Select>
	<DropDown css={{ height: '48px', main: 'min-width:100px', width: '100%' }}>
		<svelte:fragment slot="header"><IconLineHeight /></svelte:fragment>
		<section slot="content" class="spacing-values">
			<NumberInput bind:value={spacing} min={-1} step={0.125} />
			{#each [0, 0.5, 1, 1.25] as value}
				<label>
					<input type="radio" bind:group={spacing} {value} style="display: none;" />
					{value}
				</label>
			{/each}
		</section>
	</DropDown>
	<Select bind:value={font.family} items={$fontsNames} on:change let:item>
		<section style="font-family: {item}">{item}</section>
	</Select>
	<Select bind:value={textCase} items={['As is', 'UPPER', 'lower']} on:change let:item>
		{item}
	</Select>
</article>

<style lang="scss">
	article {
		display: flex;
		width: 100%;
		flex-wrap: wrap;
		& > :global(*) {
			flex: 1;
			/* min-height: 48px; */
			/* height: 100%; */
			margin: 0;
		}
	}
	.spacing-values {
		background-color: var(--secondary);
		color: var(--text-secondary);
		display: flex;
		flex-direction: column;
		& > label {
			font-size: 12px;
			padding: 8px 4px;
			background-color: var(--secondary);
			color: var(--text-secondary);
			border: var(--border-secondary);
			&:hover {
				border: var(--border-secondary-hover);
				background-color: var(--secondary-hover);
			}
			&:active {
				background-color: var(--secondary-active);
				border: var(--border-secondary-active);
			}
		}
	}
</style>
