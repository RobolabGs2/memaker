<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import UniformsList from './UniformsList.svelte';
	import type { RawShader } from '$lib/graphics/shader';
	import { createEventDispatcher } from 'svelte';
	import {
		NumberLayout,
	} from '$lib/graphics/inputs';
	import GLSLEditor, { type CompilationError } from '$lib/graphics/ui/GLSLEditor.svelte';
	import Select from '$lib/base/Select.svelte';
	import {
		parseErrors,
		userShaderSettings,
		type UserShader,
		type UserShaderType
	} from '../user_shader';
	import Label from '$lib/base/Label.svelte';
	import { completions } from './autocomplete';

	const dispatch = createEventDispatcher<{
		compile: UserShader;
	}>();

	// oncompile
	export let compilationError: string;
	let compilationErrors: CompilationError[];
	$: {
		compilationErrors = parseErrors(shader!, compilationError);
	}
	export let shaders: Record<UserShaderType, RawShader>;
	export let userShaders: UserShader[] = [];
	export let shader: UserShader | undefined;
	let newType: UserShaderType = 'effect';
	let newTitle: string = 'Пользовательский';
	let newTitleError: string = '';

	const types = ['material', 'effect'] as const;

	let shadersList: Array<undefined | UserShader> = [undefined];
	$: {
		shadersList = [undefined as undefined | UserShader].concat(userShaders);
		console.log(shadersList);
	}
</script>

<main>
	<!-- {#if creatingNewShader} -->
	<section class="shaderSelector">
		<Select
			bind:value={shader}
			css={{ height: '', width: '100%', main: '' }}
			items={shadersList}
			placeholder={undefined}
			on:change={(ev) => {
				// fragment = shaderSettings[ev.detail.value].default;
			}}
			let:item
		>
			{#if item}
				{item.title} {item.type}
			{:else}
				выберите или создайте шейдер
			{/if}
		</Select>
		<Button type="primary" style="flex: 1" on:click={() => (shader = undefined)}>
			<IconPlus />
		</Button>
	</section>
	{#if shader}
		<UniformsList bind:inputs={shader.uniforms} />
		<section>
			<Label error={compilationErrors.map((x) => x.message).join('|\n')}>Фрагментный шейдер</Label>
			<GLSLEditor
				bind:text={shader.fragment}
				errors={compilationErrors}
				hints={completions(shader)}
			/>
		</section>
		<Button
			type="primary"
			on:click={() => {
				if (shader)
					dispatch('compile', shader);
			}}
		>
			Компилировать
		</Button>
	{:else}
		<Label error={newTitleError}>
			Название
			<input bind:value={newTitle} />
		</Label>
		<Label for="ignore">
			Тип
			<Select bind:value={newType} items={types} css={{ height: '', width: '50%', main: '' }} />
		</Label>
		<Button
			type="primary"
			on:click={() => {
				const alreadyExists =
					Object.values(shaders)
						.flatMap((x) => x)
						.find((s) => s.title == newTitle) != undefined ||
					userShaders.find((s) => s.title == newTitle) != undefined;
				if (alreadyExists) {
					newTitleError = 'Шейдер с таким названием уже существует';
					return;
				}
				shader = {
					title: newTitle,
					type: newType,
					uniforms: [],
					fragment: userShaderSettings[newType].default
				};
				userShaders.push(shader);
				userShaders = userShaders;
			}}
		>
			Создать шейдер
		</Button>
	{/if}
</main>

<style>
	.shaderSelector {
		display: flex;
	}
	main {
		min-height: 512px;
	}
</style>
