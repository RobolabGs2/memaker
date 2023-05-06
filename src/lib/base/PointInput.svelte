<script lang="ts">
	import type { Point } from '$lib/geometry/point';
	import InputGroup from './InputGroup.svelte';
	import Label from './Label.svelte';
	import NumberInput from './NumberInput.svelte';

	export let value: Point;
	export let step = 1;
</script>

<InputGroup>
	<Label>x <NumberInput bind:value={value.x} {step} on:change /></Label>
	<Label>y <NumberInput bind:value={value.y} {step} on:change /></Label>
</InputGroup>
