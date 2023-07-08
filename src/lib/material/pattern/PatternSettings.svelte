<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import ToggleButton from '$lib/base/ToggleButton.svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import AddPatternModal from './AddPatternModal.svelte';
	import type { PatternSettings } from './shader';
	import { patternsNames } from './store';

	export let value: PatternSettings;

	const dispatch = createEventDispatcher<{ addPattern: { name: string; image: File } }>();

	function validateName(name: string) {
		if (patternsNames.has(name)) return 'Это имя уже занято';
		return '';
	}

	function addPattern(ev: CustomEvent<{ name: string; image: File }>) {
		dispatch('addPattern', ev.detail);
		value.name = ev.detail.name;
	}

	let openAddModal = false;
</script>

<InputGroup>
	<Label for="ignore">
		Паттерн <Select bind:value={value.name} items={$patternsNames.map((p) => p.name)} let:item>
			{item}
		</Select>
		<Button
			title="Добавить изображение как паттерн"
			width="fin-content"
			on:click={() => (openAddModal = true)}
		>
			<IconPlus size={28} />
		</Button>
	</Label>
	<Label>
		Поворот <NumberInput
			withRange
			min={-360}
			max={360}
			step={0.5}
			bind:value={value.rotate}
			on:change
		/>
	</Label>
	<Label>Сдвиг<PointInput bind:value={value.shift} on:change /></Label>
	<Label>
		Масштаб <ToggleButton
			title="Авто = растягивать по прямоугольнику"
			value={value.scale === 'font'}
			on:change={(ev) => (value.scale = ev.detail ? 'font' : { x: 1, y: 1 })}
			on:change
		>
			Авто
		</ToggleButton>
	</Label>
	{#if value.scale !== 'font'}
		<Label
			><div />
			<PointInput bind:value={value.scale} step={0.1} on:change /></Label
		>
	{/if}

	<AddPatternModal {validateName} bind:open={openAddModal} on:submit={addPattern} />
</InputGroup>
