<script lang="ts">
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import ColorInput from '$lib/base/ColorInput.svelte';
	import { createEventDispatcher } from 'svelte';
	import {
		AngleShaderMode,
		NumberLayout,
		type UniformInput,
		UniformInputTypes,
		type UniformInputType
	} from '../inputs';

	export let value: UniformInput;
	const dispatch = createEventDispatcher<{ change: { value: UniformInput; field: string } }>();
	function onChange(field: string) {
		return () => {
			dispatch('change', { value, field });
		};
	}
	function onChangeType(ev: CustomEvent<{ value: UniformInputType }>) {
		switch (ev.detail.value) {
			case 'int':
				value = {
					type: 'int',
					min: 0,
					max: 100,
					layout: NumberLayout.RANGE,
					step: 1
				};
				break;
			case 'float':
				value = {
					type: 'float',
					min: 0,
					max: 1,
					layout: NumberLayout.RANGE,
					step: 0.01
				};
				break;
			case 'angle':
				value = {
					type: 'angle',
					mode: AngleShaderMode.DEGREE,
					min: 0,
					max: 360,
					step: 0.5
				};
				break;
			case 'color':
				value = {
					type: 'color'
				};
				break;
			case 'point':
				value = {
					type: 'point',
					color: '#ff0000'
				};
				break;
			default:
				break;
		}
		onChange('type')();
	}
</script>

<article>
	<Label>
		Тип <Select
			items={UniformInputTypes}
			value={value.type}
			on:change={onChangeType}
			css={{ width: '90%', height: '', main: '' }}
		/>
	</Label>
	{#if value.type === 'float' || value.type === 'int' || value.type === 'angle'}
		{#if value.min !== undefined}
			<Label>Минимум<NumberInput bind:value={value.min} on:change={onChange('min')} /></Label>
		{/if}
		{#if value.max !== undefined}
			<Label>Максимум<NumberInput bind:value={value.max} on:change={onChange('max')} /></Label>
		{/if}
		{#if value.step !== undefined}
			<Label>Шаг<NumberInput bind:value={value.step} on:change={onChange('step')} /></Label>
		{/if}
		{#if value.type === 'float' || value.type === 'int'}
			<Select
				bind:value={value.layout}
				items={[NumberLayout.NUMBER, NumberLayout.RANGE]}
				let:item
				on:change={onChange('layout')}
			>
				{#if item === NumberLayout.NUMBER}
					Число
				{:else if item === NumberLayout.RANGE}
					С ползунком
				{/if}
			</Select>
		{:else}
		<!-- TODO: это в инпуте пользователя селектор с единицами измерения должен быть, как px/pt -->
			<Label title="В шейдере всегда радианы">
				Пользователь вводит:
				<Select
					bind:value={value.mode}
					items={[AngleShaderMode.DEGREE, AngleShaderMode.RADIAN]}
					let:item
					on:change={onChange('mode')}
				>
					{#if item === AngleShaderMode.DEGREE}
						Градусы
					{:else if item === AngleShaderMode.RADIAN}
						Радианы
					{/if}
				</Select>
			</Label>
		{/if}
	{:else if value.type === 'point'}
		<Label>Цвет в UI<ColorInput bind:value={value.color} on:change={onChange('color')} /></Label>
	{:else if value.type !== 'color'}
		ERROR
	{/if}
</article>
