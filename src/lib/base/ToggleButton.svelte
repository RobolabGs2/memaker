<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: boolean;

	const dispatcher = createEventDispatcher<{ change: boolean }>();
</script>

<button class:active={value} on:click={() => dispatcher('change', (value = !value))}>
	<slot />
</button>

<style lang="scss">
	button {
		user-select: none;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 8px 16px;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		&:hover {
			border: var(--border-secondary-hover);
			background-color: var(--secondary-hover);
		}
		&.active,
		&:active {
			background-color: var(--secondary-active);
			border: var(--border-secondary-active);
		}
	}
</style>
