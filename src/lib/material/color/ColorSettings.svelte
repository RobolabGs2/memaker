<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { MaterialSettings } from '$lib/material';

	export let value: MaterialSettings<'color'>;
</script>

<InputGroup>
	<Label>Цвет<input type="color" bind:value={value.value} on:change /></Label>
</InputGroup>
