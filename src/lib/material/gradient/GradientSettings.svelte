<script lang="ts">
	import ColorInput from '$lib/base/ColorInput.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { Gradient4Settings } from './shader';

	export let value: Gradient4Settings;
</script>

<Label>Слева<ColorInput bind:value={value.color1} on:change /></Label>
<Label>Справа<ColorInput bind:value={value.color2} on:change /></Label>
<Label>Сверху<ColorInput bind:value={value.color3} on:change /></Label>
<Label>Снизу<ColorInput bind:value={value.color4} on:change /></Label>
