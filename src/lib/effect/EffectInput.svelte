<script lang="ts">
	import PreviewActions from '$lib/PreviewActions.svelte';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import Select from '$lib/base/Select.svelte';
	import JsonView from '$lib/debug/JsonView.svelte';
	import { slide } from 'svelte/transition';
	import type { Effect, EffectSettings, EffectType } from '.';
	import BrightnessContrastSettings from './brightness_contrast/BrightnessContrastSettings.svelte';
	import BugleSettings from './bugle/BugleSettings.svelte';
	import NoiseSettings from './noise/NoiseSettings.svelte';
	import PinchSettings from './pinch/PinchSettings.svelte';
	import SwirlSettings from './swirl/SwirlSettings.svelte';
	import TemperatureSettings from './temperature/TemperatureSettings.svelte';
	export let value: Effect[];
	export let defaults: (type: EffectType) => EffectSettings<EffectType>;

	function addNewEffect(ev: CustomEvent<{ value: string }>) {
		selectorValue = placeholderKey;
		if (ev.detail.value === placeholderKey) return;
		const defaultValue = defaults(ev.detail.value as EffectType);
		if (!defaultValue) {
			return;
		}
		const i = value.push({ settings: structuredClone(defaultValue) }) - 1;
		value = value;
		active = { id: value[i], value: value[i] };
	}

	function makeShiftEffectHandler(shift: number) {
		return (ev: CustomEvent<Effect>) => {
			const effect = ev.detail;
			const i = value.indexOf(effect);
			if (i === -1) {
				console.warn(`Not found effect in list ${effect.settings.type}`);
				return;
			}
			const j = i + shift;
			if (j < 0 || value.length <= j) return;
			value[i] = value[j];
			value[j] = effect;
		};
	}

	function removeEffect(ev: CustomEvent<Effect>) {
		const effect = ev.detail;
		const i = value.indexOf(effect);
		if (i === -1) {
			console.warn(`Not found effect in list ${effect.settings.type}`);
			return;
		}
		value.splice(i, 1);
		value = value;
		if (active.id === effect && value.length) {
			const id = Math.max(0, i - 1);
			active = { id: value[id], value: value[id] };
		}
	}

	const upEffect = makeShiftEffectHandler(1);
	const downEffect = makeShiftEffectHandler(-1);

	const placeholderKey = '__add__' as const;
	const modeNames: Record<EffectType | typeof placeholderKey, string> = {
		bugle: 'Выпуклость',
		pinch: 'Вогнутость',
		swirl: 'Закрученность',
		grayscale: 'Оттенки серого',
		brightness_contrast: 'Яркость и контраст',
		temperature: 'Температура',
		noise: 'Шум',
		[placeholderKey]: 'Добавить эффект'
	};
	const effectKeys = Object.keys(modeNames) as (keyof typeof modeNames)[];

	let active = { id: value[0], value: value[0] };
	$: {
		if (!active.value && value.length) {
			active.value = value[value.length - 1];
			active.id = active.value;
		}
	}
	let selectorValue = placeholderKey;
</script>

<article>
	<header>
		<Select
			type="primary"
			hideOnClick
			bind:value={selectorValue}
			items={effectKeys}
			placeholder={placeholderKey}
			on:change={addNewEffect}
			let:item
			on:change
		>
			{modeNames[item]}
		</Select>
	</header>

	{#if value.length}
		<PreviewsContainer
			reverse
			items={value.map((value) => ({
				id: value,
				value
			}))}
			bind:active
			let:item
		>
			<section class="preview" transition:slide|local>
				{modeNames[item.value.settings.type]}
				<PreviewActions
					value={item.value}
					up
					down
					remove
					on:up={upEffect}
					on:down={downEffect}
					on:remove={removeEffect}
				/>
			</section>
			{#if item.id === active.id}
				{@const type = active.value.settings.type}
				{#if type === 'brightness_contrast'}
					<div transition:slide>
						<BrightnessContrastSettings bind:value={active.value.settings} />
					</div>
				{:else if type === 'temperature'}
					<div transition:slide>
						<TemperatureSettings bind:value={active.value.settings} />
					</div>
				{:else if type === 'bugle'}
					<div transition:slide>
						<BugleSettings bind:value={active.value.settings} />
					</div>
				{:else if type === 'pinch'}
					<div transition:slide>
						<PinchSettings bind:value={active.value.settings} />
					</div>
				{:else if type === 'swirl'}
					<div transition:slide>
						<SwirlSettings bind:value={active.value.settings} />
					</div>
				{:else if type === 'noise'}
					<div transition:slide>
						<NoiseSettings bind:value={active.value.settings} />
					</div>
				{:else if type !== 'grayscale'}
					<div transition:slide>
						<JsonView bind:value={active.value.settings} />
					</div>
				{/if}
			{/if}
		</PreviewsContainer>
	{/if}
</article>

<style lang="scss">
	article {
		min-height: 256px;
		display: flex;
		flex-direction: column;
	}
	.preview {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-left: 8px;
	}
	div {
		width: 100%;
		padding: 8px 0px 8px 8px;
	}
</style>
