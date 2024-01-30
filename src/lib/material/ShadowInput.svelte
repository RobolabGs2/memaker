<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import type { ShadowSettings } from '$lib/material';

	export let value: ShadowSettings;
</script>

<InputGroup>
	<Label>Цвет<input type="color" bind:value={value.color} on:change /></Label>
	<Label>Сдвиг<PointInput bind:value={value.offset} on:change /></Label>
	<Label>Размытие<NumberInput min={0} max={1000} bind:value={value.blur} on:change /></Label>
	<Label>
		Насыщенность <NumberInput
			min={-1}
			max={1}
			step={0.01}
			withRange
			bind:value={value.saturation}
			on:change
		/>
	</Label>
</InputGroup>
