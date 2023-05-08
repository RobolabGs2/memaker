<script lang="ts">
	import Button from './base/Button.svelte';

	import { IconTrash, IconArrowUp, IconArrowDown, IconCopy } from '@tabler/icons-svelte';
	import { createEventDispatcher } from 'svelte';

	type T = $$Generic;
	export let value: T;
	export let up = false;
	export let down = false;
	export let copy = false;
	export let remove = false;

	interface EventMap {
		up: T;
		down: T;
		remove: T;
		copy: T;
	}

	const dispatch = createEventDispatcher<EventMap>();
	function redirectEvent(name: keyof EventMap) {
		return (ev: Event) => {
			ev.preventDefault();
			ev.stopPropagation();
			dispatch(name, value);
		};
	}
	const iconSize = 16;
</script>

<footer>
	{#if remove}
		<Button type="danger" on:click={redirectEvent('remove')}><IconTrash size={iconSize} /></Button>
	{/if}
	{#if copy}
		<Button on:click={redirectEvent('copy')}><IconCopy size={iconSize} /></Button>
	{/if}
	{#if up}
		<Button on:click={redirectEvent('up')}><IconArrowUp size={iconSize} /></Button>
	{/if}
	{#if down}
		<Button on:click={redirectEvent('down')}><IconArrowDown size={iconSize} /></Button>
	{/if}
	<slot />
</footer>

<style lang="scss">
	footer {
		display: flex;
		width: 100%;
		& > :global(*) {
			height: 32px;
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
</style>
