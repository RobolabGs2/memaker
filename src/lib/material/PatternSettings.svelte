<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import type { MaterialSettings } from './material';
	import Select from '$lib/base/Select.svelte';
	import { patternsNames } from './patterns_store';
	import ToggleButton from '$lib/base/ToggleButton.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	export let value: MaterialSettings<'pattern'>;
</script>

<InputGroup>
	<Label>
		Паттерн <Select bind:value={value.name} items={$patternsNames.map((p) => p.name)} on:change />
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
		<InputGroup><PointInput bind:value={value.scale} on:change /></InputGroup>
	{/if}
</InputGroup>
