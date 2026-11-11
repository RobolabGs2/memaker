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
		completions,
		parseErrors,
		preprocessUserShader,
		userShaderSettings,
		type UserShader,
		type UserShaderType
	} from '../user_shader';
	import Label from '$lib/base/Label.svelte';

	const dispatch = createEventDispatcher<{
		compile: {
			type: 'material' | 'effect';
			shader: RawShader;
		};
	}>();

	// oncompile
	export let compilationError: string;
	let compilationErrors: CompilationError[];
	$: {
		compilationErrors = parseErrors(shader!, compilationError);
	}
	export let shaders: Record<UserShaderType, RawShader>;
	export let userShaders: UserShader[] = [
		{
			title: 'Глитч',
			type: 'effect',
			fragment: `#define PI 3.1415926

float rand(vec2 co, float step) {
    return fract(cos(dot(co * step, vec2(15.2851, 18.435))) * 74687.84583);
}

vec4 effect() {
    int subrowWidth = 10;
    float maxRadius = maxRadius/resolution.x;
    float rowIndex = texCoord.y*resolution.y/float(rowWidth);
    float subrowIndex = texCoord.y*resolution.y/float(subrowWidth);
    float colIndex = texCoord.x*resolution.x/float(colWidth);

    vec2 shift = texCoord;
    vec2 cellSeed = floor(vec2(rowIndex, colIndex));
    vec2 rowSeed = floor(vec2(rowIndex, rowIndex));
    shift.x += maxRadius*rand(cellSeed, 1.);
    vec4 shifted = texture(layer, shift);
    vec4 origin = texture(layer, texCoord);
    // vec4 origin = texture(layer, floor(vec2(colIndex, rowIndex))*vec2(colWidth, rowWidth)/resolution);
    // origin += texture(layer, texCoord + shift);
    // origin /= 2.;
    float rndR = rand(texCoord, 1.);
    float rndG = rand(texCoord, 2.);
    float rndB = rand(texCoord, 3.);
    vec4 originCoef = vec4(rndR, rndG, rndB, 1);
    vec4 shiftedCoef = vec4(1)-originCoef;
    return originCoef*origin+shiftedCoef*shifted;
}`,
			uniforms: [
				{
					name: 'rowWidth',
					title: 'Ширина строки',
					input: {
						type: 'float',
						default: 10,
						// min: 1,
						step: 1,
						layout: NumberLayout.NUMBER
					}
				},
				{
					name: 'colWidth',
					title: 'Ширина столбца',
					input: {
						type: 'float',
						default: 100,
						// min: 1,
						step: 1,
						layout: NumberLayout.NUMBER
					}
				},
				{
					name: 'maxRadius',
					title: 'Радиус',
					input: {
						type: 'float',
						default: 100,
						// min: 1,
						step: 10,
						layout: NumberLayout.NUMBER
					}
				},
				{
					name: 'color',
					title: 'Цвет',
					input: {
						type: 'color',
						default: '#000000'
					}
				}
			]
		}
	];
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
					dispatch('compile', {
						type: shader.type,
						shader: preprocessUserShader(shader)
					});
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
