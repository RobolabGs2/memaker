<script lang="ts">
	import { slide } from 'svelte/transition';
	import UniformEditor from './UniformEditor.svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import type { UniformDesc } from '$lib/graphics/shader';
	import { NumberLayout } from '$lib/graphics/inputs';
	import Button from '$lib/base/Button.svelte';
	import PreviewActions from '$lib/PreviewActions.svelte';

	export let inputs: UniformDesc[];

	let openUniforms = true;
	function onUniformChanged() {
		inputs = inputs;
	}
	let activeUniform = inputs[0];
	function onAddUniform() {
		const uniform: UniformDesc = {
			name: `uniform${inputs.length}`,
			title: `Юниформ ${inputs.length}`,
			input: {
				type: 'int',
				default: 0,
				min: 0,
				max: 1,
				layout: NumberLayout.RANGE
			}
		};
		inputs.push(uniform);
		inputs = inputs;
		activeUniform = uniform;
	}

	function shifter(dir: -1 | 1): (ev: CustomEvent<UniformDesc>) => void {
		return (ev: CustomEvent<UniformDesc>) => {
			const item = ev.detail;
			const curIndex = inputs.indexOf(item);
			const nextIndex = curIndex + dir;
			if (nextIndex < 0 || inputs.length <= nextIndex) return;
			inputs[curIndex] = inputs[nextIndex];
			inputs[nextIndex] = item;
		};
	}
	const shiftUp = shifter(-1);
	const shiftDown = shifter(1);
	function remove(ev: CustomEvent<UniformDesc>) {
		const item = ev.detail;
		const i = inputs.indexOf(item);
		inputs.splice(i, 1);
		inputs = inputs;
		if (item === activeUniform) {
			activeUniform = inputs[0]
		}
	}
</script>

<article>
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<header>
		<button on:click={() => (openUniforms = !openUniforms)}>
			<span>Параметры</span>
			<Button on:click={onAddUniform} width="32px" height="32px" type="primary">
				<IconPlus />
			</Button>
		</button>
	</header>
	{#if openUniforms}
		<div transition:slide class="body">
			<section>
				<PreviewsContainer
					items={inputs}
					getId={(input) => input}
					bind:active={activeUniform}
					let:item
				>
					<section class="preview">
						<span>
							{item.input.type}
							{item.name}
							{item.title}
						</span>
						<PreviewActions
							value={item}
							up
							down
							remove
							on:up={shiftUp}
							on:down={shiftDown}
							on:remove={remove}
						/>
					</section>
				</PreviewsContainer>
			</section>
			<section class="tabs">
				{#if activeUniform}
					<UniformEditor bind:value={activeUniform} on:change={onUniformChanged} />
				{/if}
			</section>
		</div>
	{/if}
</article>

<style lang="scss">
	article {
		background-color: var(--secondary-active);
	}
	button {
		padding-left: 4px;
		font-size: inherit;
		font-family: inherit;
		border: none;
		cursor: pointer;

		background-color: inherit;
		color: inherit;
		width: 100%;

		display: flex;
		align-items: end;
		justify-content: space-between;
	}
	.body {
		display: flex;
		& > section:first-child {
			flex: 1;
		}
		& > section:last-child {
			flex: 1;
			overflow: auto;
		}
	}
	.preview {
		padding: 4px 8px;
		width: 100%;
		text-align: left;
		display: flex;
		flex-direction: row;
		justify-content: space-between;
		align-items: center;
	}
	.tabs {
		height: 100%;
		height: 300px;
	}
</style>
