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
	import PointInput from '$lib/base/PointInput.svelte';

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
					default: 0,
					min: 0,
					max: 100,
					layout: NumberLayout.RANGE,
					step: 1
				};
				break;
			case 'float':
				value = {
					type: 'float',
					default: 0,
					min: 0,
					max: 1,
					layout: NumberLayout.RANGE,
					step: 0.01
				};
				break;
			case 'angle':
				value = {
					type: 'angle',
					default: 0,
					min: 0,
					max: 360,
					step: 0.5
				};
				break;
			case 'color':
				value = {
					type: 'color',
					default: '#ffffff'
				};
				break;
			case 'point':
				value = {
					type: 'point',
					color: '#ff0000',
					default: {
						type: 'frame',
						value: { x: 0.5, y: 0.5 }
					}
				};
				break;
			default:
				break;
		}
		onChange('type')();
	}
</script>

<article>
	<Label for="ignore">
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
		{/if}
		<Label>
			По умолчанию<NumberInput bind:value={value.default} on:change={onChange('default')} />
		</Label>
	{:else if value.type === 'point'}
		<Label>Цвет в UI<ColorInput bind:value={value.color} on:change={onChange('color')} /></Label>
		<Label>
			По умолчанию<PointInput bind:value={value.default.value} on:change={onChange('default')} />
		</Label>
		<Label for="ignore">
			Умолчание вычисляется <Select
				bind:value={value.default.type}
				items={['frame', 'absolute']}
				let:item
			>
				{#if item == 'frame'}
					относительно фрейма
				{:else}
					как задано
				{/if}
			</Select>
		</Label>
	{:else if value.type === 'color'}
		<Label>По умолчанию <ColorInput bind:value={value.default} /></Label>
	{:else}
		ERROR
	{/if}
</article>
