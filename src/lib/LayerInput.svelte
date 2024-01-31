<script lang="ts">
	import type { LayerSettings } from './meme';
	import Select from './base/Select.svelte';
	import type { BlendMode, ComposeMode } from './graphics/graphics';
	import Label from './base/Label.svelte';
	import Checkbox from './base/Checkbox.svelte';
	import { slide } from 'svelte/transition';
	import NumberInput from './base/NumberInput.svelte';

	export let value: LayerSettings;

	const blendModesMap: Record<BlendMode, string> = {
		normal: 'Нормальный',
		multiply: 'Умножение',
		screen: 'Экранное осветление',
		overlay: 'Перекрытие',
		darken: 'Замена тёмным',
		lighten: 'Замена светлым',
		color_dodge: 'Осветление основы',
		color_burn: 'Затемнение основы',
		hard_light: 'Направленный свет',
		soft_light: '',
		difference: 'Разница',
		exclusion: 'Исключение',
		hue: '',
		saturation: '',
		color: '',
		luminosity: '',
		xor: 'Xor'
	};
	const blendModes = Object.keys(blendModesMap) as BlendMode[];
	const composeModesMap: Record<ComposeMode, string> = {
		clear: '',
		copy: '',
		destination: '',
		source_over: '',
		destination_over: '',
		source_in: '',
		destination_in: '',
		source_out: '',
		destination_out: '',
		source_atop: '',
		destination_atop: '',
		lighter: '',
		xor: 'Xor'
	};
	const composeModes = Object.keys(composeModesMap) as ComposeMode[];

	const layerPresets: Array<{
		name: string;
		value: Pick<LayerSettings, 'blendMode' | 'composeMode'>;
	}> = [
		{ name: 'Нормальный', value: { blendMode: 'normal', composeMode: 'source_over' } },
		{ name: 'Умножение', value: { blendMode: 'multiply', composeMode: 'source_over' } },
		{ name: 'Добавление', value: { blendMode: 'normal', composeMode: 'lighter' } },
		{ name: 'Экранное осветление', value: { blendMode: 'screen', composeMode: 'source_over' } },
		{ name: 'Перекрытие', value: { blendMode: 'overlay', composeMode: 'source_over' } },
		{ name: 'Замена тёмным', value: { blendMode: 'darken', composeMode: 'source_over' } },
		{ name: 'Замена светлым', value: { blendMode: 'lighten', composeMode: 'source_over' } },
		{ name: 'Осветление основы', value: { blendMode: 'color_dodge', composeMode: 'source_over' } },
		{ name: 'Затемнение основы', value: { blendMode: 'color_burn', composeMode: 'source_over' } },
		{ name: 'Направленный свет', value: { blendMode: 'hard_light', composeMode: 'source_over' } },
		{ name: 'Разница', value: { blendMode: 'difference', composeMode: 'source_over' } },
		{ name: 'Исключение', value: { blendMode: 'exclusion', composeMode: 'source_over' } },
		{ name: 'Xor', value: { blendMode: 'xor', composeMode: 'source_over' } }
	];

	let expertMode = false;
	const selectCss = {
		height: '32px',
		width: '100%',
		main: ''
	};
</script>

<main>
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
	<article>
		<section>Режим:</section>
		<section>
			<Select
				css={selectCss}
				value={layerPresets.find(
					({ value: { blendMode, composeMode } }) =>
						value.blendMode == blendMode && value.composeMode == composeMode
				)}
				items={layerPresets}
				let:item
				on:change={(event) => {
					const preset = event.detail.value;
					if (!preset) return;
					value.blendMode = preset.value.blendMode;
					value.composeMode = preset.value.composeMode;
				}}
			>
				{item?.name || 'Иное'}
			</Select>
		</section>
	</article>
	<Label>
		<span>Показать все настройки</span>
		<Checkbox bind:value={expertMode} />
	</Label>
	{#if expertMode}
		<div transition:slide|local>
			<article>
				<section>Режим смешивания:</section>
				<section>
					<Select css={selectCss} bind:value={value.blendMode} items={blendModes} let:item>
						{blendModesMap[item] || item.replace('_', ' ')}
					</Select>
				</section>
			</article>
			<article>
				<section>Режим наложения:</section>
				<section>
					<Select css={selectCss} bind:value={value.composeMode} items={composeModes} let:item>
						{composeModesMap[item] || item.replace('_', ' ')}
					</Select>
				</section>
			</article>
		</div>
	{/if}
</main>

<style lang="scss">
	main {
		padding-left: 4px;
	}
	article {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 8px;
		margin-bottom: 8px;
	}
	section:first-child {
		flex: 3;
	}
	section:last-child {
		flex: 4;
	}
</style>
