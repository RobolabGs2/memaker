<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import { type UniformInput } from '$lib/graphics/inputs';
	import type { UniformDesc } from '$lib/graphics/shader';
	import UniformInputEditor from '$lib/graphics/ui/UniformInputEditor.svelte';

	export let value: UniformDesc;

	function onUniformChanged(ev: CustomEvent<{ value: UniformInput; field: string }>) {
		const { value: newValue, field } = ev.detail;
		if (field === 'type') {
			switch (newValue.type) {
				case 'int':
				case 'float':
				case 'angle':
					value.input.default = 0;
					break;
				case 'color':
					value.input.default = '#ff0000';
					break;
				case 'point':
					value.input.default = { type: 'frame', value: { x: 0.5, y: 0.5 } };
			}
		}

		value.input = newValue;
	}
</script>

<article>
	<InputGroup>
		<Label>Имя в коде <input bind:value={value.name} on:change /></Label>
		<Label>Имя в UI <input bind:value={value.title} on:change /></Label>
		<Label title="Будет появляться при наведении, как этот текст">
			Описание <textarea rows="2" bind:value={value.description} on:change />
		</Label>
	</InputGroup>
	<UniformInputEditor value={value.input} on:change={onUniformChanged} on:change />
</article>

<style>
	textarea {
		width: 50%;
		max-width: 50%;
		min-width: 50%;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
	}

	article {
		padding: 8px;
		background-color: var(--secondary);
	}
</style>
