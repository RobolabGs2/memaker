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
	export let value: Material<MaterialType>;
	export let defaults: MaterialSettings<MaterialType>[];

	function changeTypeHandler(ev: CustomEvent<{ value: string }>) {
		const defaultValue = defaults.find((v) => v.type === ev.detail.value);
		if (!defaultValue) throw new Error(`Not found default value for type ${ev.detail.value}`);
		value.settings = defaultValue;
	}

	const modeNames = {
		disabled: 'Выключить',
		color: 'Цвет',
		pattern: 'Паттерн'
	} as Record<string, string>;
</script>

<article>
	<header>
		<Select
			value={value.settings.type}
			items={['disabled', 'color', 'pattern']}
			on:change={changeTypeHandler}
			let:item
			on:change
		>
			{modeNames[item]}
		</Select>
	</header>
	{#if value.settings.type !== 'disabled'}
		<InputGroup>
			{#if value.settings.type === 'color'}
				<div transition:slide><ColorSettings bind:value={value.settings} on:change /></div>
			{:else if value.settings.type === 'pattern'}
				<div transition:slide>
					<PatternSettings bind:value={value.settings} on:change on:addPattern />
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
