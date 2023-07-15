<script lang="ts">
	import ColorInput from '$lib/base/ColorInput.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { ColorSettings } from './shader';

	export let value: ColorSettings;
</script>

<Label>Цвет<ColorInput bind:value={value.value} on:change /></Label>
