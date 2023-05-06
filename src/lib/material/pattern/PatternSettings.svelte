<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import ToggleButton from '$lib/base/ToggleButton.svelte';
	import type { MaterialSettings } from '$lib/material';
	import { patternsNames } from './store';
	export let value: MaterialSettings<'pattern'>;
</script>

<InputGroup>
	<Label>
		Паттерн <Select value={value.name} items={$patternsNames.map((p) => p.name)} />
	</Label>
	<Label>
		Поворот <NumberInput min={-360} max={360} step={0.5} bind:value={value.rotate} on:change />
	</Label>
	<Label>Сдвиг<PointInput bind:value={value.shift} on:change /></Label>
	<Label>
		Масштаб <ToggleButton
			value={value.scale === 'font'}
			on:change={(ev) => (value.scale = ev.detail ? 'font' : { x: 1, y: 1 })}
			on:change
		>
			Авто
		</ToggleButton>
	</Label>
	{#if value.scale !== 'font'}
		<InputGroup><PointInput bind:value={value.scale} step={0.1} on:change /></InputGroup>
	{/if}
</InputGroup>
