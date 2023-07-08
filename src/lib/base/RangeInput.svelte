<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: number;
	export let min: number;
	export let max: number;
	export let step = 1;

	const dispatch = createEventDispatcher<{ input: number; change: number }>();
</script>

<input
	type="range"
	bind:value
	{min}
	{max}
	{step}
	on:input={(ev) => dispatch('input', Number(ev.currentTarget.value))}
	on:change={(ev) => dispatch('change', Number(ev.currentTarget.value))}
/>

<style lang="scss">
	input {
		padding: 0;
	}
</style>
