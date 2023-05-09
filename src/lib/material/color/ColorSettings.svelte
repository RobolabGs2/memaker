<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { ColorSettings } from './shader';

	export let value: ColorSettings;
</script>

<InputGroup>
	<Label>Цвет<input type="color" bind:value={value.value} on:change /></Label>
</InputGroup>
