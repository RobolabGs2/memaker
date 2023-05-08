<script lang="ts">
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import TabsContainer from '$lib/base/TabsContainer.svelte';
	import AtlasDescription from '$lib/icons/atlas.json';
	import AtlasPng from '$lib/icons/atlas.png';
	import AtlasIcon from '$lib/icons/AtlasIcon.svelte';
	import MaterialInput from '$lib/material/MaterialInput.svelte';
	import { fontSettingsToCSS } from './font';
	import { applyStylePreset, presets, type StylePresetType } from './presets';
	import type { TextStyle } from './text';
	import TextSettings from './TextSettings.svelte';

	export let style: TextStyle;
	export let text: string;

	type TabEntry = {
		icon: string;
		label: string;
	};
	let tabs: TabEntry[] = [
		{
			icon: 'fill',
			label: 'Заливка'
		},
		{
			icon: 'stroke',
			label: 'Обводка'
		}
	];
	let selected = tabs[0];
	const choosePreset: { name: string; preset: StylePresetType | null } = {
		name: 'Выбрать пресет...',
		preset: null
	};
	let presetName = choosePreset;
	function applyPreset(
		ev: CustomEvent<{ value: { name: string; preset: null | StylePresetType } }>
	) {
		const preset = ev.detail.value.preset;
		if (!preset) return;
		style = applyStylePreset(preset, style);
		presetName = choosePreset;
	}
</script>

<article>
	<Select
		bind:value={presetName}
		placeholder={choosePreset}
		items={[choosePreset, ...$presets.map((x) => ({ name: x.name, preset: x }))]}
		on:change={applyPreset}
		on:change
		let:item
	>
		{#if item.preset}
			<div style="font: {fontSettingsToCSS(item.preset.font, 16)}">
				{item.name}
			</div>
		{:else}
			<div>
				{item.name}
			</div>
		{/if}
	</Select>
	<TextSettings
		bind:font={style.font}
		bind:textCase={style.case}
		bind:align={style.align}
		bind:baseline={style.baseline}
		bind:spacing={style.lineSpacing}
		on:change
	/>
	<textarea style="width:100%" rows="6" bind:value={text} on:change />
	<TabsContainer {tabs} let:tab bind:activeTab={selected}>
		<div class="icon">
			<AtlasIcon
				size={24}
				name={tab.icon}
				atlasDescription={AtlasDescription}
				atlasURL={AtlasPng}
			/>
		</div>
		<div slot="content">
			{#if tab.label === 'Заливка'}
				<MaterialInput
					bind:value={style.fill}
					defaults={[
						{ type: 'disabled' },
						{ type: 'color', value: '#ffffff' },
						{
							type: 'pattern',
							name: 'fire',
							rotate: 0,
							scale: 'font',
							shift: { x: 0, y: 0 }
						}
					]}
					on:change
					on:addPattern
				/>
			{:else if tab.label === 'Обводка'}
				<Label>
					Толщина обводки (%)
					<NumberInput bind:value={style.strokeWidth} min={0} />
				</Label>
				<MaterialInput
					bind:value={style.stroke}
					defaults={[
						{ type: 'disabled' },
						{ type: 'color', value: '#000000' },
						{
							type: 'pattern',
							name: 'fire',
							rotate: 0,
							scale: 'font',
							shift: { x: 0, y: 0 }
						}
					]}
					on:change
					on:addPattern
				/>
			{/if}
		</div>
	</TabsContainer>
</article>

<style lang="scss">
	textarea {
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
	}
</style>
