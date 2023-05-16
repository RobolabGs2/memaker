<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import type { TemperatureSettings } from '.';

	export let value: TemperatureSettings;
</script>

<InputGroup>
	<Label>
		Температура <NumberInput
			bind:value={value.temperature}
			min={1000}
			max={20000}
			step={100}
			on:change
		/>
	</Label>
	<Label>
		Сила <NumberInput bind:value={value.strength} min={-1} max={1} step={0.05} on:change />
	</Label>
</InputGroup>
