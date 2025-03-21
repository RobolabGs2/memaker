<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import { slide } from 'svelte/transition';
	import type { Material, MaterialSettings } from '.';
	import ShadowInput from './ShadowInput.svelte';
	import ColorSettings from './color/ColorSettings.svelte';
	import PatternSettings from './pattern/PatternSettings.svelte';
	import GradientSettings from './gradient/GradientSettings.svelte';
	import JsonView from '$lib/debug/JsonView.svelte';
	import type { RawShader } from '$lib/graphics/shader';
	import Checkbox from '$lib/base/Checkbox.svelte';
	import UniformInput from '$lib/graphics/ui/UniformInput.svelte';
	import { getDefaultValue } from '$lib/graphics/inputs';
	import { IsOldMaterial } from '.';
	export let value: Material;
	export let defaults: MaterialSettings[];
	export let shaders: Record<string, RawShader>;
	export let context: { frame: { width: number; height: number } };

	const disableKey = '__disable__';
	function changeTypeHandler(ev: CustomEvent<{ value: string }>) {
		const newType = ev.detail.value;
		if (newType === disableKey) {
			value.settings = undefined;
			return;
		}
		const defaultValue = defaults.find((v) => v.type === newType);
		if (defaultValue) {
			value.settings = structuredClone(defaultValue);
			return;
		}
		const shaderInputs = shaders[newType]?.inputs;
		if (!shaderInputs) throw new Error(`Not found default value for type ${ev.detail.value}`);
		value.settings = {
			type: newType,
			settings: {}
		};
		for (const input of shaderInputs || []) {
			value.settings.settings[input.name] = getDefaultValue(
				input.input.type,
				input.default,
				context
			);
		}
	}

	let materialKeys: string[];
	$: {
		materialKeys = [disableKey, ...Object.keys(shaders)];
	}
</script>

<article>
	<header>
		<Select
			value={value.settings?.type || disableKey}
			items={materialKeys}
			on:change={changeTypeHandler}
			let:item
			on:change
		>
			{shaders[item]?.title || 'Выключить'}
		</Select>
	</header>
	{#if value.settings}
		<InputGroup>
			{@const type = value.settings.type}
			{@const shader = shaders[type]}
			{#if IsOldMaterial('color', value.settings)}
				<div transition:slide>
					<ColorSettings bind:value={value.settings} on:change />
				</div>
			{:else if IsOldMaterial('pattern', value.settings)}
				<div transition:slide>
					<PatternSettings bind:value={value.settings} on:change on:addPattern />
				</div>
			{:else if IsOldMaterial('gradient4', value.settings)}
				<div transition:slide>
					<GradientSettings bind:value={value.settings} />
				</div>
			{:else if shader?.inputs}
				<div transition:slide>
					<InputGroup>
						{#each shader.inputs as input (input)}
							<UniformInput
								desc={input}
								name={input.name}
								{context}
								bind:value={value.settings.settings}
							/>
						{/each}
					</InputGroup>
				</div>
			{:else}
				<div transition:slide>
					<JsonView bind:value={value.settings} />
				</div>
			{/if}
			<div transition:slide>
				<Label>
					Прозрачность (%) <NumberInput
						withRange
						min={0}
						max={100}
						step={1}
						value={100 - value.alpha * 100}
						on:change
						on:input={(ev) => {
							value.alpha = (100 - ev.detail) / 100;
						}}
					/>
				</Label>
				<Label>
					Тень <Checkbox
						value={value.shadow !== undefined}
						on:change={(ev) => {
							value.shadow = ev.detail
								? { blur: 10, color: '#000000', offset: { x: 0, y: 0 }, saturation: 0.0 }
								: undefined;
						}}
						on:change
					/>
				</Label>
				{#if value.shadow}
					<div>
						<ShadowInput bind:value={value.shadow} on:change />
					</div>
				{/if}
			</div>
		</InputGroup>
	{/if}
</article>

<style lang="scss">
	article {
		min-height: 256px;
	}
</style>
