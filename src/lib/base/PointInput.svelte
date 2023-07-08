<script lang="ts">
	import type { Point } from '$lib/geometry/point';
	import InputGroup from './InputGroup.svelte';
	import NumberInput from './NumberInput.svelte';

	export let value: Point;
	export let step = 1;
</script>

<InputGroup>
	<section><span>x</span><NumberInput bind:value={value.x} {step} on:change /></section>
	<section><span>y</span><NumberInput bind:value={value.y} {step} on:change /></section>
</InputGroup>

<style lang="scss">
	section {
		display: flex;
		align-items: center;
		& > span {
			&::after {
				content: ':';
			}
			padding-right: 8px;
		}
	}
</style>
