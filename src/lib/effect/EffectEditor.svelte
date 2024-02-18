<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import JsonView from '$lib/debug/JsonView.svelte';
	import type { ShaderInputDesc } from '$lib/graphics/shader';
	import { createEventDispatcher } from 'svelte';

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
	let inputs: ShaderInputDesc[] = [];
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
</script>

<main>
	<Button type="primary" on:click={() => dispatch('compile', { fragment, inputs, title })}
		>Компилировать</Button
	>
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
		<header>Инпуты</header>
		<JsonView bind:value={inputs} />
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
</style>
