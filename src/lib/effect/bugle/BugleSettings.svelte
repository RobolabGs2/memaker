<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import type { BugleSettings } from '.';

	export let value: BugleSettings;
</script>

<InputGroup>
	<Label>
		Сила <NumberInput bind:value={value.strength} min={0} max={1.5} step={0.05} on:change />
	</Label>
	<Label>
		Радиус <NumberInput bind:value={value.radius} min={0} step={1} on:change />
	</Label>
	<Label>
		Центр <PointInput bind:value={value.center} on:change />
	</Label>
</InputGroup>
