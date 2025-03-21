<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import type { UniformDesc } from '$lib/graphics/shader';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import { createEventDispatcher } from 'svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import {
		NumberLayout,
		uniformInputTypeToGLSL,
		type UniformInputType
	} from '$lib/graphics/inputs';
	import GLSLEditor, { type CompilationError } from '$lib/graphics/ui/GLSLEditor.svelte';
	import { type Completion } from '@codemirror/autocomplete';
	import UniformEditor from './UniformEditor.svelte';
	import Select from '$lib/base/Select.svelte';
	import { deepCopy } from '$lib/state';

	const dispatch = createEventDispatcher<{
		compile: {
			type: 'material' | 'effect';
			shader: {
				title: string;
				vertex?: string;
				fragment: string;
				inputs: UniformDesc[];
			};
		};
	}>();

	// oncompile
	export let compilationError: string | undefined = undefined;
	let title: string = 'debug_shader';
	let inputs: UniformDesc[] = [
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
	let type: 'material' | 'effect' = 'effect';
	const header = {
		material: `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D stencilSampler;
uniform vec3 color;
uniform float alpha;
uniform int channel;
uniform int channels;

in vec2 texCoord;
out vec4 FragColor;

float channelAlpha(int currentChannel, int channels, vec4 o);
vec4 material();
void main() {
    vec4 origin = texture(stencilSampler, texCoord);
    float originAlpha = channelAlpha(channel, channels, origin);
    FragColor = material();
    FragColor.a *= originAlpha * alpha;
}`,
		effect: `#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
in vec2 texCoord;
out vec4 FragColor;
vec4 effect();
void main() {
    FragColor = effect();
}`
	};
	const defaults = {
		material: `vec4 material() {
    vec4 color = vec4(1.0, 0, 0, 1.0);
    return color;
}`,
		effect: `vec4 effect() {
    vec4 color = texture(layer, texCoord);
    return color;
}`
	};
	let fragment: string = defaults[type];
	function shaderHeader() {
		return (
			header[type] +
			inputs.map((u) => `uniform ${uniformInputTypeToGLSL(u.input.type)} ${u.name};`).join('')
		);
	}
	let activeUniform = inputs[0];
	function onAddUniform() {
		const uniform: UniformDesc = {
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
		const header = shaderHeader().split('\n');
		return err
			.matchAll(/ERROR: \d+:(\d+): (.+)/g)
			.map((match) => {
				const [_full, line, message] = match;
				return { line: Math.max(1, +line - header.length), message } as CompilationError;
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
	function completions(inputs: UniformDesc[]): Completion[] {
		return inputs
			.map((desc) => {
				return {
					label: desc.name,
					type: 'variable',
					detail: `${typeHint(desc.input.type)}: ${desc.title}`,
					info: desc.description
				} as Completion;
			})
			.concat([
				{
					label: 'layer',
					type: 'variable',
					detail: 'sampler2D: Текстура с текущим слоем'
				},
				{
					label: 'texCoord',
					type: 'constant',
					detail: 'vec2: Текстурные координаты на layer'
				}
			]);
	}
	function onUniformChanged() {
		inputs = inputs;
	}
	const types = ['material', 'effect'] as const;
</script>

<main>
	<Select
		bind:value={type}
		items={types}
		on:change={(ev) => {
			fragment = defaults[ev.detail.value];
		}}
	/>
	<Button
		type="primary"
		on:click={() =>
			dispatch('compile', {
				type,
				shader: {
					fragment: shaderHeader() + '\n' + fragment,
					inputs: deepCopy(inputs),
					title
				}
			})}
	>
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
			<Button on:click={onAddUniform} width="32px" height="32px" type="primary">
				<IconPlus />
			</Button>
		</header>
		<PreviewsContainer
			items={inputs}
			getId={(input) => input.name}
			bind:active={activeUniform}
			let:item
		>
			{#if item == activeUniform}
				<UniformEditor bind:value={activeUniform} on:change={onUniformChanged} />
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
	header {
		display: flex;
		align-items: end;
		justify-content: space-between;
	}
</style>
