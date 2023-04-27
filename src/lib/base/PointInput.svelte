<script lang="ts">
	import type { Point } from '$lib/geometry/point';
	import InputGroup from './InputGroup.svelte';
	import Label from './Label.svelte';
	import NumberInput from './NumberInput.svelte';

	export let value: Point;
</script>

<InputGroup>
	<Label>x <NumberInput bind:value={value.x} on:change /></Label>
	<Label>y <NumberInput bind:value={value.y} on:change /></Label>
</InputGroup>
