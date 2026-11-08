<script lang="ts">
	import ColorInput from '$lib/base/ColorInput.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import { NumberLayout, getDefaultValue } from '$lib/graphics/inputs';
	import type { UniformDesc } from '$lib/graphics/shader';

	export let desc: UniformDesc;
	export let value: Record<string, any>;
	export let name: string;
	export let context: { frame: { width: number; height: number } };

	$: {
		const defaultValue = getDefaultValue(desc.input.type, desc.input.default, context);
		if (value[name] === undefined || typeof value[name] !== typeof defaultValue)
			value[name] = defaultValue;
	}

	const angleSelectCSS = {
		height: '32px',
		width: '54px',
		main: ''
	};
	let angleMode: '°' | 'rad' = '°';
	function onAngleChange(ev: CustomEvent<number>) {
		const newAngle = ev.detail;
		value[name] = angleMode == '°' ? newAngle / 180 * Math.PI : newAngle;
	}
</script>

<Label for="ignore">
	<span title={desc.description}>
		{#if desc.input.type == 'point'}
			<div style={`width:10px;height:10px;background-color:${desc.input.color};`} />
		{/if}
		{desc.title}
	</span>
	{#if desc.input.type == 'float'}
		<NumberInput
			bind:value={value[name]}
			min={desc.input.min ?? -Infinity}
			max={desc.input.max ?? Infinity}
			step={desc.input.step ?? 0.1}
			withRange={desc.input.layout == NumberLayout.RANGE}
		/>
	{:else if desc.input.type == 'int'}
		<NumberInput
			bind:value={value[name]}
			min={desc.input.min ?? Number.MIN_SAFE_INTEGER}
			max={desc.input.max ?? Number.MAX_SAFE_INTEGER}
			step={desc.input.step ?? 1}
			withRange={desc.input.layout == NumberLayout.RANGE}
		/>
	{:else if desc.input.type == 'angle'}
		<NumberInput
			value={angleMode == '°' ? value[name] * 180 / Math.PI : value[name] }
			min={desc.input.min ?? -Infinity}
			max={desc.input.max ?? Infinity}
			step={desc.input.step ?? 0.5}
			on:change={onAngleChange}
		/>
		<Select items={['°', 'rad']} bind:value={angleMode} css={angleSelectCSS} />
	{:else if desc.input.type == 'color'}
		<ColorInput bind:value={value[name]} />
	{:else if desc.input.type == 'point'}
		<PointInput bind:value={value[name]} />
	{/if}
</Label>

<style lang="scss">
	span {
		display: flex;
		align-items: center;
		div {
			margin-right: 4px;
		}
	}
</style>
