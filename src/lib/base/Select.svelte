<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import DropDown from './DropDown.svelte';
	type T = $$Generic;
	interface EventMap {
		change: { value: T };
	}
	export let value: T;
	export let items: readonly T[];
	export let placeholder: T | undefined = undefined;
	export let css = {
		height: '48px',
		width: '100%',
		main: ''
	};
	export let hideOnClick = false;
	const dispatch = createEventDispatcher<EventMap>();
</script>

<DropDown {css} {hideOnClick}>
	<svelte:fragment slot="header"><slot item={value}>{value}</slot></svelte:fragment>
	<svelte:fragment slot="content">
		{#each items as item}
			{#if item != placeholder}
				<label class:active={item === value}>
					<input
						type="radio"
						bind:group={value}
						value={item}
						on:change={(ev) => {
							if (ev.currentTarget.checked) dispatch('change', { value: item });
						}}
					/>
					<slot {item}>{item}</slot>
				</label>
			{/if}
		{/each}
	</svelte:fragment>
</DropDown>

<style lang="scss">
	input {
		display: none;
	}
	label {
		padding: 4px;
		width: 100%;
		min-height: 28px;
		display: flex;
		justify-content: center;
		align-items: center;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		&:hover {
			border: var(--border-secondary-hover);
			background-color: var(--secondary-hover);
		}
		&:active {
			background-color: var(--secondary-active);
			border: var(--border-secondary-active);
		}
	}
</style>
