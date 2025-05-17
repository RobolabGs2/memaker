<script lang="ts">
	import { slide } from 'svelte/transition';
	import UniformEditor from './UniformEditor.svelte';
	import { IconPlus } from '@tabler/icons-svelte';
	import PreviewsContainer from '$lib/PreviewsContainer.svelte';
	import type { UniformDesc } from '$lib/graphics/shader';
	import { NumberLayout } from '$lib/graphics/inputs';
	import Button from '$lib/base/Button.svelte';

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
			default: 0,
			input: {
				type: 'int',
				min: 0,
				max: 1,
				layout: NumberLayout.RANGE
			}
		};
		inputs.push(uniform);
		inputs = inputs;
		activeUniform = uniform;
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
					<span class="preview">
						{item.input.type}
						{item.name}
						{item.title}
					</span>
				</PreviewsContainer>
			</section>
			<section class="tabs">
				<UniformEditor bind:value={activeUniform} on:change={onUniformChanged} />
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
	}
	.tabs {
		height: 100%;
		height: 300px;
	}
</style>
