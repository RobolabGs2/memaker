<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import type { BrightnessContrastSettings } from '.';

	export let value: BrightnessContrastSettings;
</script>

<InputGroup>
	<Label
		>Яркость<NumberInput
			bind:value={value.brightness}
			min={-1}
			max={1}
			step={0.05}
			on:change
		/></Label
	>
	<Label
		>Контраст<NumberInput
			bind:value={value.contrast}
			min={-1}
			max={1}
			step={0.05}
			on:change
		/></Label
	>
</InputGroup>
