<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { Gradient4Settings } from './shader';

	export let value: Gradient4Settings;
</script>

<InputGroup>
	<Label>Слева<input type="color" bind:value={value.color1} on:change /></Label>
	<Label>Справа<input type="color" bind:value={value.color2} on:change /></Label>
	<Label>Сверху<input type="color" bind:value={value.color3} on:change /></Label>
	<Label>Снизу<input type="color" bind:value={value.color4} on:change /></Label>
</InputGroup>
