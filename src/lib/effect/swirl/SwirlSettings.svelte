<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import type { SwirlSettings } from '.';

	export let value: SwirlSettings;
</script>

<InputGroup>
	<Label>
		Угол <NumberInput bind:value={value.angle} step={0.5} on:change />
	</Label>
	<Label>
		Радиус <NumberInput bind:value={value.radius} min={0} step={1} on:change />
	</Label>
	<Label>
		Центр <PointInput bind:value={value.center} on:change />
	</Label>
</InputGroup>
