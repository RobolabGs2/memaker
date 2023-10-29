<script lang="ts">
	import PreviewActions from '$lib/PreviewActions.svelte';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import Select from '$lib/base/Select.svelte';
	import { slide } from 'svelte/transition';
	import type { Effect, EffectSettings } from '.';
	import InputGroup from '$lib/base/InputGroup.svelte';
	import ShaderInput from './ShaderInput.svelte';
	import type { RawShader } from '$lib/graphics/shader';
	import { getDefaultValue } from '$lib/graphics/inputs';
	export let value: Effect[];
	export let shaders: Record<string, RawShader>;
	export let context: { frame: { width: number; height: number } };

	function addNewEffect(ev: CustomEvent<{ value: string }>) {
		selectorValue = placeholderKey;
		if (ev.detail.value === placeholderKey) return;
		const shader = shaders[ev.detail.value];
		if (!shader) {
			return;
		}
		const defaultValue: EffectSettings = {};
		for (const input of shader.inputs || []) {
			defaultValue[input.name] = getDefaultValue(input.input.type, input.default, context);
		}
		const i =
			value.push({
				type: ev.detail.value,
				settings: defaultValue
			}) - 1;
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
	const effectKeys = [...Object.keys(shaders), placeholderKey];

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
			{shaders[item]?.title || 'Добавить эффект'}
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
				{shaders[item.value.type].title}
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
				{@const type = active.value.type}
				{@const shader = shaders[type]}
				{#if shader.inputs}
					<div transition:slide>
						<InputGroup>
							{#each shader.inputs as input (input)}
								<ShaderInput
									desc={input}
									name={input.name}
									{context}
									bind:value={active.value.settings}
								/>
							{/each}
						</InputGroup>
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
