<script lang="ts">
	import ToggleButton from '$lib/base/ToggleButton.svelte';
	import Select from '$lib/base/Select.svelte';
	import type { FontSettings } from './font';
	import { fontsNames } from './fonts_store';
	import type { TextAlign, TextBaseline, TextCase, TextFontSizeStrategy } from './text';
	import {
		IconAlignLeft,
		IconAlignCenter,
		IconAlignRight,
		IconArrowBarToUp,
		IconArrowBarToDown,
		IconBold,
		IconItalic,
		IconLetterCase,
		IconLetterCaseLower,
		IconLetterCaseUpper,
		IconLineHeight
	} from '@tabler/icons-svelte';
	import { mdiFormatAlignMiddle } from '@mdi/js';
	import DropDown from '$lib/base/DropDown.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import SvgIcon from '$lib/base/icons/SvgIcon.svelte';
	import FontSizeStrategyInput from './FontSizeStrategyInput.svelte';

	export let font: FontSettings;
	export let textCase: TextCase;
	export let align: TextAlign;
	export let baseline: TextBaseline;
	export let spacing: number;
	export let fontSizeStrategy: TextFontSizeStrategy;

	const fontFamilySize: Record<string, number> = {
		'JetBrains Mono': 15,
		'Press Start 2P': 9
	};

	const buttonWidth = '48px';
	const selectCSS = {
		height: '48px',
		width: '100%',
		main: 'min-width: 52px;max-width: 92px;'
	};
</script>

<article>
	<ToggleButton title="Курсив" bind:value={font.italic} width={buttonWidth} on:change>
		<IconItalic size={20} />
	</ToggleButton>
	<ToggleButton title="Жирный" bind:value={font.bold} width={buttonWidth} on:change>
		<IconBold size={20} />
	</ToggleButton>
	<ToggleButton title="Капитель" bind:value={font.smallCaps} width={buttonWidth} on:change>
		<span style="font-size: 20px;font-variant: small-caps;">Аа</span>
	</ToggleButton>
	<FontSizeStrategyInput bind:value={fontSizeStrategy} />
	<Select
		css={selectCSS}
		title="Выравнивание"
		bind:value={align}
		items={['left', 'center', 'right']}
		on:change
		let:item
	>
		{#if item == 'left'}
			<IconAlignLeft size={20} />
		{:else if item == 'center'}
			<IconAlignCenter size={20} />
		{:else if item == 'right'}
			<IconAlignRight size={20} />
		{/if}
	</Select>
	<Select
		css={selectCSS}
		title="Позиционирование"
		bind:value={baseline}
		items={['top', 'middle', 'bottom']}
		on:change
		let:item
	>
		{#if item == 'top'}
			<IconArrowBarToUp size={20} />
		{:else if item == 'middle'}
			<SvgIcon type="mdi" path={mdiFormatAlignMiddle} size={20} />
		{:else if item == 'bottom'}
			<IconArrowBarToDown size={20} />
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
			main: 'min-width: 148px;'
		}}
		title="Шрифт"
		bind:value={font.family}
		items={$fontsNames}
		on:change
		let:item
	>
		<section style="font-family: '{item}';font-size: {fontFamilySize[item] || 16}px">
			{item}
		</section>
	</Select>
	<Select
		css={selectCSS}
		title="Регистр"
		bind:value={textCase}
		items={['As is', 'UPPER', 'lower']}
		on:change
		let:item
	>
		{#if item === 'As is'}
			<IconLetterCase size={20} />
		{:else if item === 'UPPER'}
			<IconLetterCaseUpper size={20} />
		{:else if item === 'lower'}
			<IconLetterCaseLower size={20} />
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
