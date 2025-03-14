<script lang="ts">
	import DropDown from '$lib/base/DropDown.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import type { TextFontSizeStrategy } from './text';

	export let value: TextFontSizeStrategy;
</script>

<DropDown
	title="Размер шрифта"
	css={{ height: '48px', main: 'min-width:156px;flex: 1', width: '100%' }}
>
	<svelte:fragment slot="header">
		{#if value.type === 'same-height'}
			Одинаковая высота
		{:else if value.type === 'same-width'}
			Одинаковая ширина
		{:else if value.type === 'fixed'}
			<NumberInput bind:value={value.value} min={1} />{value.unit}
		{:else if value.type === 'relative'}
			<NumberInput bind:value={value.value} min={1} step={0.1} />{value.unit}
		{:else}
			ERROR
		{/if}
	</svelte:fragment>
	<section slot="content" class="values">
		<label>
			<input
				type="radio"
				bind:group={value}
				value={{ type: 'same-height' }}
				style="display: none;"
			/>
			Одинаковая высота
		</label>
		<label>
			<input
				type="radio"
				bind:group={value}
				value={{ type: 'same-width' }}
				style="display: none;"
			/>
			Одинаковая ширина
		</label>
		<label>
			<input
				type="radio"
				bind:group={value}
				value={{ type: 'fixed', unit: 'pt', value: 60 }}
				style="display: none;"
			/>
			Пункты (pt)
		</label>
		<label>
			<input
				type="radio"
				bind:group={value}
				value={{ type: 'fixed', unit: 'px', value: 80 }}
				style="display: none;"
			/>
			Пиксели (px)
		</label>
		<label>
			<input
				type="radio"
				bind:group={value}
				value={{ type: 'relative', unit: 'vh', value: 7.4 }}
				style="display: none;"
			/>
			% от высоты кадра (vh)
		</label>
	</section>
</DropDown>

<style lang="scss">
	.values {
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
