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
		IconArrowBarToUp,
		IconArrowBarToDown,
		IconItalic,
		IconBold,
		IconLineHeight
	} from '@tabler/icons-svelte';
	import { mdiFormatAlignMiddle } from '@mdi/js';
	import DropDown from '$lib/base/DropDown.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import SvgIcon from '$lib/base/icons/SvgIcon.svelte';

	export let font: FontSettings;
	export let textCase: TextCase;
	export let align: TextAlign;
	export let baseline: TextBaseline;
	export let spacing: number;
</script>

<article>
	<ToggleButton title="Курсив" bind:value={font.italic} on:change>
		<IconItalic size={20} />
	</ToggleButton>
	<ToggleButton title="Жирный" bind:value={font.bold} on:change>
		<IconBold size={20} />
	</ToggleButton>
	<ToggleButton title="Капитель" bind:value={font.smallCaps} on:change
		><span style="font-size: 20px;font-variant: small-caps;">Аа</span></ToggleButton
	>
	<Select
		title="Выравнивание"
		bind:value={align}
		items={['left', 'center', 'right']}
		on:change
		let:item
	>
		{#if item == 'left'}
			<IconAlignLeft />
		{:else if item == 'center'}
			<IconAlignCenter />
		{:else if item == 'right'}
			<IconAlignRight />
		{/if}
	</Select>
	<Select
		title="Позиционирование"
		bind:value={baseline}
		items={['top', 'middle', 'bottom']}
		on:change
		let:item
	>
		{#if item == 'top'}
			<IconArrowBarToUp />
		{:else if item == 'middle'}
			<SvgIcon type="mdi" path={mdiFormatAlignMiddle} />
		{:else if item == 'bottom'}
			<IconArrowBarToDown />
		{/if}
	</Select>
	<DropDown
		title="Междустрочный интервал"
		css={{ height: '48px', main: 'min-width:100px', width: '100%' }}
	>
		<svelte:fragment slot="header"><IconLineHeight /></svelte:fragment>
		<section slot="content" class="spacing-values">
			<NumberInput bind:value={spacing} min={-1} step={0.125} precision={3} />
			{#each [0, 0.5, 1, 1.25] as value}
				<label>
					<input type="radio" bind:group={spacing} {value} style="display: none;" />
					{value}
				</label>
			{/each}
		</section>
	</DropDown>
	<Select
		css={{
			height: '48px',
			width: '100%',
			main: 'min-width: 128px;'
		}}
		title="Шрифт"
		bind:value={font.family}
		items={$fontsNames}
		on:change
		let:item
	>
		<section style="font-family: '{item}'">{item}</section>
	</Select>
	<Select
		title="Регистр"
		bind:value={textCase}
		items={['As is', 'UPPER', 'lower']}
		on:change
		let:item
	>
		{#if item === 'As is'}
			Как есть
		{:else if item === 'UPPER'}
			КАПС
		{:else if item === 'lower'}
			строчные
		{/if}
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
