<script lang="ts">
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
		<button class="danger" on:click={redirectEvent('remove')}><IconTrash size={iconSize} /></button>
	{/if}
	{#if copy}
		<button on:click={redirectEvent('copy')}><IconCopy size={iconSize} /></button>
	{/if}
	{#if up}
		<button on:click={redirectEvent('up')}><IconArrowUp size={iconSize} /></button>
	{/if}
	{#if down}
		<button on:click={redirectEvent('down')}><IconArrowDown size={iconSize} /></button>
	{/if}
	<slot />
</footer>

<style lang="scss">
	footer {
		display: flex;
		width: 100%;
		& > * {
			height: 32px;
			flex: 1;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	}
	button {
		cursor: pointer;
	}
	.danger:hover {
		background-color: #aa0000;
	}
</style>
