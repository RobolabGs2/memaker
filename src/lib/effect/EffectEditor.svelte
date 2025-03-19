<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import JsonView from '$lib/debug/JsonView.svelte';
	import type { ShaderInputDesc } from '$lib/graphics/shader';
	import UniformInputView from '$lib/graphics/ui/UniformInputView.svelte';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import {
		NumberLayout,
		uniformInputTypeToGLSL,
		type UniformInputType
	} from '$lib/graphics/inputs';
	import GLSLEditor, { type CompilationError } from '$lib/effect/GLSLEditor.svelte';
	import { type Completion } from '@codemirror/autocomplete';
	import UniformInput from './UniformInput.svelte';
	import { SwirlShader } from './swirl';

	const dispatch = createEventDispatcher<{
		compile: {
			title: string;
			vertex?: string;
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
	inputs = SwirlShader.inputs!;
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
	let activeUniform = inputs[0];
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
		activeUniform = uniform;
	}
	const parseErrors = (err: string | undefined) => {
		if (!err) return [];
		const added = new Set();
		return err
			.matchAll(/ERROR: \d+:(\d+): (.+)/g)
			.map((match) => {
				const [_full, line, message] = match;
				return { line: +line, message } as CompilationError;
			})
			.filter((err) => {
				const key = err.line + err.message;
				if (added.has(key)) return false;
				added.add(key);
				return true;
			})
			.toArray();
	};
	function typeHint(type: UniformInputType) {
		const glsl = uniformInputTypeToGLSL(type);
		return glsl === type ? glsl : `${glsl} (${type})`;
	}
	function completions(inputs: ShaderInputDesc[]): Completion[] {
		return inputs.map((desc) => {
			return {
				label: desc.name,
				type: 'variable',
				detail: `${typeHint(desc.input.type)}: ${desc.title}`,
				info: desc.description
			} as Completion;
		});
	}
	function onUniformChanged() {
		inputs = inputs;
	}
</script>

<main>
	<Button type="primary" on:click={() => dispatch('compile', { fragment, inputs, title })}>
		Компилировать
	</Button>
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
			items={inputs}
			getId={(input) => input.name}
			bind:active={activeUniform}
			let:item
		>
			{#if item == activeUniform}
				<UniformInput bind:value={activeUniform} on:change={onUniformChanged} />
			{:else}
				{item.input.type} {item.name}
			{/if}
		</PreviewsContainer>
	</section>
	<section>
		<header>Фрагментный шейдер</header>
		<GLSLEditor
			bind:text={fragment}
			errors={parseErrors(compilationError)}
			hints={completions(inputs)}
		/>
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
