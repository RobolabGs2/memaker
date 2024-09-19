<script lang="ts">
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import { NumberLayout, type UniformInput, UniformInputTypes } from '../inputs';

	export let value: UniformInput;
</script>

<article>
	<Select bind:value={value.type} items={UniformInputTypes} />
	{#if value.type === 'float' || value.type === 'int'}
		{#if value.min !== undefined}
			<Label>Минимум<NumberInput bind:value={value.min} /></Label>
		{/if}
		{#if value.max !== undefined}
			<Label>Максимум<NumberInput bind:value={value.max} /></Label>
		{/if}
		{#if value.step !== undefined}
			<Label>Шаг<NumberInput bind:value={value.step} /></Label>
		{/if}
		<Select bind:value={value.layout} items={[NumberLayout.NUMBER, NumberLayout.RANGE]} let:item>
			{#if item === NumberLayout.NUMBER}
			Число
			{:else if item === NumberLayout.RANGE}
			С ползунком
			{/if}
		</Select>
	{:else if value.type === 'angle'}{:else if value.type === 'point'}{:else if value.type === 'color'}{:else}
		ERROR
	{/if}
</article>
