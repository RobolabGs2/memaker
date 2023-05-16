<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import type { NoiseSettings } from '.';

	export let value: NoiseSettings;
</script>

<InputGroup>
	<Label>
		Радиус <NumberInput bind:value={value.radius} min={0} step={1} on:change />
	</Label>
	<Label>
		Минимальный альфа-канал <NumberInput
			bind:value={value.minAlpha}
			min={0}
			max={1}
			step={0.05}
			on:change
		/>
	</Label>
	<Label>
		Максимальный альфа-канал <NumberInput
			bind:value={value.maxAlpha}
			min={0}
			max={1}
			step={0.05}
			on:change
		/>
	</Label>
</InputGroup>
