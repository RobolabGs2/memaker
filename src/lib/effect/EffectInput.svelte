<script lang="ts">
	import Select from '$lib/base/Select.svelte';
	import { slide } from 'svelte/transition';
	import JsonView from '$lib/debug/JsonView.svelte';
	import { EffectDefaults, type Effect, type EffectSettings, type EffectType } from '.';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import PreviewActions from '$lib/PreviewActions.svelte';
	export let value: Effect[];
	export let defaults: EffectSettings<EffectType>[] = Object.values(EffectDefaults);

	function addNewEffect(ev: CustomEvent<{ value: string }>) {
		selectorValue = placeholderKey;
		const defaultValue = defaults.find((v) => v.type === ev.detail.value);
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
		noise: 'Шум',
		bugle: 'Выпуклость',
		pinch: 'Впуклость',
		swirl: 'Закрученность',
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
			height="s%"
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
				<div transition:slide>
					<JsonView bind:value={active.value.settings} />
				</div>
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
</style>
