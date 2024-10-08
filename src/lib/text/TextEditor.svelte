<script lang="ts">
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import Select from '$lib/base/Select.svelte';
	import SvgIcon from '$lib/base/icons/SvgIcon.svelte';
	import TabsContainer from '$lib/base/TabsContainer.svelte';
	import MaterialInput from '$lib/material/MaterialInput.svelte';
	import { fontSettingsToCSS } from './font';
	import { applyStylePreset, presets, type StylePresetType } from './presets';
	import type { TextStyle } from './text';
	import TextSettings from './TextSettings.svelte';
	import { IconBrandTopbuzz } from '@tabler/icons-svelte';
	import type { Material } from '$lib/material';
	import { fontSettingsToKey } from './metrics';
	import type { Container } from '$lib/meme';
	import FontSizeStrategyInput from './FontSizeStrategyInput.svelte';
	import InputGroup from '$lib/base/InputGroup.svelte';
	import InputRow from '$lib/base/InputRow.svelte';
	import LineSpacingInput from './LineSpacingInput.svelte';

	export let style: TextStyle;
	export let text: string;
	export let container: Container;

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
	const colorNames: Record<string, string | undefined> = {
		'#ffffff': 'белая',
		'#000000': 'чёрная'
	};
	function textMaterialTooltip(material: Material) {
		const res = [];
		switch (material.settings.type) {
			case 'disabled':
				return 'отсутствует';
			case 'color':
				res.push(colorNames[material.settings.value] || `цвет: ${material.settings.value}`);
				break;
			case 'pattern':
				res.push(`паттерн (${material.settings.name})`);
				break;
			case 'gradient4':
				res.push(`градиент`);
				break;
		}
		if (material.shadow) res.push('с тенью');
		return res.join(' ');
	}
	function presetTooltip(preset: StylePresetType) {
		return `Шрифт: ${fontSettingsToKey(preset.font, ' ')}
Заливка: ${textMaterialTooltip(preset.fill)}
Обводка: ${textMaterialTooltip(preset.stroke)}`;
	}

	// https://icons.getbootstrap.com/icons/paint-bucket/
	const bootstrapFillSvg =
		'M6.192 2.78c-.458-.677-.927-1.248-1.35-1.643a2.972 2.972 0 0 0-.71-.515c-.217-.104-.56-.205-.882-.02-.367.213-.427.63-.43.896-.003.304.064.664.173 1.044.196.687.556 1.528 1.035 2.402L.752 8.22c-.277.277-.269.656-.218.918.055.283.187.593.36.903.348.627.92 1.361 1.626 2.068.707.707 1.441 1.278 2.068 1.626.31.173.62.305.903.36.262.05.64.059.918-.218l5.615-5.615c.118.257.092.512.05.939-.03.292-.068.665-.073 1.176v.123h.003a1 1 0 0 0 1.993 0H14v-.057a1.01 1.01 0 0 0-.004-.117c-.055-1.25-.7-2.738-1.86-3.494a4.322 4.322 0 0 0-.211-.434c-.349-.626-.92-1.36-1.627-2.067-.707-.707-1.441-1.279-2.068-1.627-.31-.172-.62-.304-.903-.36-.262-.05-.64-.058-.918.219l-.217.216zM4.16 1.867c.381.356.844.922 1.311 1.632l-.704.705c-.382-.727-.66-1.402-.813-1.938a3.283 3.283 0 0 1-.131-.673c.091.061.204.15.337.274zm.394 3.965c.54.852 1.107 1.567 1.607 2.033a.5.5 0 1 0 .682-.732c-.453-.422-1.017-1.136-1.564-2.027l1.088-1.088c.054.12.115.243.183.365.349.627.92 1.361 1.627 2.068.706.707 1.44 1.278 2.068 1.626.122.068.244.13.365.183l-4.861 4.862a.571.571 0 0 1-.068-.01c-.137-.027-.342-.104-.608-.252-.524-.292-1.186-.8-1.846-1.46-.66-.66-1.168-1.32-1.46-1.846-.147-.265-.225-.47-.251-.607a.573.573 0 0 1-.01-.068l3.048-3.047zm2.87-1.935a2.44 2.44 0 0 1-.241-.561c.135.033.324.11.562.241.524.292 1.186.8 1.846 1.46.45.45.83.901 1.118 1.31a3.497 3.497 0 0 0-1.066.091 11.27 11.27 0 0 1-.76-.694c-.66-.66-1.167-1.322-1.458-1.847z';
	let moreSettings = false;
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
			<div
				style="font: {fontSettingsToCSS(item.preset.font, 16)}"
				title={presetTooltip(item.preset)}
			>
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
		bind:moreSettings
		on:change
	/>
	{#if moreSettings}
		<InputGroup>
			<InputRow>
				<span>Размер текста</span>
				<FontSizeStrategyInput bind:value={style.fontSizeStrategy} />
			</InputRow>
			<InputRow>
				<span>Междустрочный интервал</span>
				<LineSpacingInput bind:value={style.lineSpacing} />
			</InputRow>
			{#if container.type === 'global'}
				<Label>
					Отступ: <NumberInput
						min={0}
						max={100}
						step={0.5}
						withRange={true}
						withButtons={false}
						value={style.padding * 100}
						on:input={(ev) => {
							style.padding = ev.detail / 100;
						}}
					/>
				</Label>
			{/if}
		</InputGroup>
	{/if}
	<textarea
		style="width:100%;max-width: 100%;min-width: 100%;"
		rows="6"
		bind:value={text}
		on:change
	/>

	<TabsContainer {tabs} let:tab bind:activeTab={selected}>
		<div class="icon" title={tab.label}>
			{#if tab.icon === 'fill'}
				<SvgIcon type={'bootstrap'} path={bootstrapFillSvg} size={32} />
			{:else if tab.icon === 'stroke'}
				<IconBrandTopbuzz transform="rotate(-12)" size={32} />
			{/if}
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
							scale: { x: 1, y: 1 },
							shift: { x: 0, y: 0 }
						},
						{
							type: 'gradient4',
							color1: '#ff0000',
							color2: '#00ff00',
							color3: '#0000ff',
							color4: '#fff000'
						}
					]}
					on:change
					on:addPattern
				/>
			{:else if tab.label === 'Обводка'}
				<Label>
					Толщина обводки (%)
					<NumberInput bind:value={style.strokeWidth} min={0} rangeMax={50} withRange />
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
							scale: { x: 1, y: 1 },
							shift: { x: 0, y: 0 }
						},
						{
							type: 'gradient4',
							color1: '#ff0000',
							color2: '#00ff00',
							color3: '#0000ff',
							color4: '#fff000'
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
	.icon {
		display: flex;
	}
	textarea {
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
	}
</style>
