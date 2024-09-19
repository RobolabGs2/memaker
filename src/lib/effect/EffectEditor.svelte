<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import JsonView from '$lib/debug/JsonView.svelte';
	import type { ShaderInputDesc } from '$lib/graphics/shader';
	import UniformInputView from '$lib/graphics/ui/UniformInputView.svelte';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import { createEventDispatcher } from 'svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import ShaderInput from './ShaderInput.svelte';
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import { NumberLayout } from '$lib/graphics/inputs';

	const dispatch = createEventDispatcher<{
		compile: {
			title: string;
			fragment: string;
			inputs: ShaderInputDesc[];
		};
	}>();

	// oncompile
	export let compilationError: string | undefined = undefined;
	let title: string = 'debug_shader';
	let inputs: ShaderInputDesc[] = [
		{
			name: 'test',
			title: 'Test',
			default: 2,
			input: {
				type: 'int',
				min: 0,
				max: 255,
				step: 1,
				layout: NumberLayout.RANGE
			}
		}
	];
	let fragment: string = `#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
in vec2 texCoord;
out vec4 FragColor;

void main() {
    vec4 color = texture(layer, texCoord);
    FragColor = color;
}`;
	let activeUniform = { id: inputs[0]?.name, value: inputs[0] };
	function onAddUniform() {
		const uniform: ShaderInputDesc = {
			name: `uniform${inputs.length}`,
			title: `Юниформ ${inputs.length}`,
			default: 0,
			input: {
				type: 'float',
				min: 0,
				max: 1,
				layout: NumberLayout.RANGE
			}
		};
		inputs.push(uniform);
		inputs = inputs;
		activeUniform = { id: uniform.name, value: uniform };
	}
</script>

<main>
	<Button type="primary" on:click={() => dispatch('compile', { fragment, inputs, title })}>
		Компилировать
	</Button>
	{#if compilationError}
		<pre>
			{compilationError}
		</pre>
	{/if}
	<section>
		<header>Ключ</header>
		<input />
		<header>Название</header>
		<input bind:value={title} />
	</section>
	<section>
		<header>
			<span>Параметры</span>
			<Button on:click={onAddUniform} width="32px" height="32px" type="primary"><IconPlus /></Button
			>
		</header>
		<PreviewsContainer
			items={inputs.map((value) => ({ id: value.name, value }))}
			bind:active={activeUniform}
			let:item
		>
			{#if item == activeUniform}
				<InputGroup>
					<Label>Имя в коде <input bind:value={activeUniform.value.name} /></Label>
					<Label>Имя в UI <input bind:value={activeUniform.value.title} /></Label>
					<Label>Описание <textarea bind:value={activeUniform.value.description} /></Label>
					<UniformInputView bind:value={activeUniform.value.input} />
				</InputGroup>
			{:else}
				{item.value.input.type} {item.value.name}
			{/if}
		</PreviewsContainer>
	</section>
	<section>
		<header>Фрагментный шейдер</header>
		<textarea bind:value={fragment} rows="24" />
	</section>
</main>

<style>
	textarea {
		width: 100%;
		color: inherit;
		background-color: inherit;
	}
	header {
		display: flex;
		align-items: end;
		justify-content: space-between;
	}
</style>
