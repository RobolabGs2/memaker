<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import { slide } from 'svelte/transition';
	import type { Material, MaterialSettings, MaterialType } from '.';
	import ShadowInput from './ShadowInput.svelte';
	import ColorSettings from './color/ColorSettings.svelte';
	import PatternSettings from './pattern/PatternSettings.svelte';
	import GradientSettings from './gradient/GradientSettings.svelte';
	import JsonView from '$lib/debug/JsonView.svelte';
	export let value: Material<MaterialType>;
	export let defaults: MaterialSettings<MaterialType>[];

	function changeTypeHandler(ev: CustomEvent<{ value: string }>) {
		const defaultValue = defaults.find((v) => v.type === ev.detail.value);
		if (!defaultValue) throw new Error(`Not found default value for type ${ev.detail.value}`);
		value.settings = structuredClone(defaultValue);
	}

	const modeNames: Record<MaterialType, string> = {
		disabled: 'Выключить',
		color: 'Цвет',
		pattern: 'Паттерн',
		gradient4: 'Градиент (крестовой)'
	};
	const materialKeys = Object.keys(modeNames) as MaterialType[];
</script>

<article>
	<header>
		<Select
			value={value.settings.type}
			items={materialKeys}
			on:change={changeTypeHandler}
			let:item
			on:change
		>
			{modeNames[item]}
		</Select>
	</header>
	{#if value.settings.type !== 'disabled'}
		<InputGroup>
			{@const type = value.settings.type}
			{#if type === 'color'}
				<div transition:slide><ColorSettings bind:value={value.settings} on:change /></div>
			{:else if type === 'pattern'}
				<div transition:slide>
					<PatternSettings bind:value={value.settings} on:change on:addPattern />
				</div>
			{:else if type === 'gradient4'}
				<div transition:slide>
					<GradientSettings bind:value={value.settings} />
				</div>
			{:else}
				<div transition:slide>
					<JsonView bind:value={value.settings} />
				</div>
			{/if}
			<div transition:slide>
				<Label>
					Прозрачность (%) <NumberInput
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
					Тень <input
						type="checkbox"
						checked={value.shadow !== undefined}
						on:change={(ev) => {
							value.shadow = ev.currentTarget.checked
								? { blur: 10, color: '#000000', offset: { x: 0, y: 0 } }
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
