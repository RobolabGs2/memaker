<script lang="ts">
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import { NumberLayout } from '$lib/graphics/inputs';
	import type { ShaderInputDesc } from '$lib/graphics/shader';

	export let desc: ShaderInputDesc;
	export let value: Record<string, any>;
	export let name: string;

	$: {
		if (value[name] === undefined) value[name] = structuredClone(desc.default);
	}
</script>

<Label>
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
			bind:value={value[name]}
			min={desc.input.min ?? -Infinity}
			max={desc.input.max ?? Infinity}
			step={desc.input.step ?? 0.5}
		/>
	{:else if desc.input.type == 'color'}
		<input type="color" bind:value={value[name]} />
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
