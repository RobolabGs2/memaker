<script lang="ts">
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import { AngleShaderMode, NumberLayout, type UniformInput, UniformInputTypes } from '../inputs';

	export let value: UniformInput;
</script>

<article>
	<Select bind:value={value.type} items={UniformInputTypes} on:change />
	{#if value.type === 'float' || value.type === 'int' || value.type === 'angle'}
		{#if value.min !== undefined}
			<Label>Минимум<NumberInput bind:value={value.min} on:change /></Label>
		{/if}
		{#if value.max !== undefined}
			<Label>Максимум<NumberInput bind:value={value.max} on:change /></Label>
		{/if}
		{#if value.step !== undefined}
			<Label>Шаг<NumberInput bind:value={value.step} on:change /></Label>
		{/if}
		{#if value.type === 'float' || value.type === 'int'}
			<Select
				bind:value={value.layout}
				items={[NumberLayout.NUMBER, NumberLayout.RANGE]}
				let:item
				on:change
			>
				{#if item === NumberLayout.NUMBER}
					Число
				{:else if item === NumberLayout.RANGE}
					С ползунком
				{/if}
			</Select>
		{:else}
			<Label title="В шейдере всегда радианы">
				Пользователь вводит:
				<Select
					bind:value={value.mode}
					items={[AngleShaderMode.DEGREE, AngleShaderMode.RADIAN]}
					let:item
					on:change
				>
					{#if item === AngleShaderMode.DEGREE}
						Градусы
					{:else if item === AngleShaderMode.RADIAN}
						Радианы
					{/if}
				</Select>
			</Label>
		{/if}
	{:else if value.type !== 'color' && value.type !== 'point'}
		ERROR
	{/if}
</article>
