<script lang="ts">
	type IdType = $$Generic;
	type Item = $$Generic<{ id: IdType }>;
	export let items: Array<Item>;
	export let active: Item;
	export let reverse = false;
	export let height = '100%';
</script>

<main
	class:reverse
	style="height: {height};min-height: {height};max-height: {height};"
	on:drop
	on:dragover
>
	{#each items as item, index (item.id)}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<article class="item" class:active={item.id === active.id} on:click={() => (active = item)}>
			<slot {item} {index} />
		</article>
	{/each}
</main>

<style lang="scss">
	.item {
		user-select: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		border-radius: 8px 8px 0 0;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		&:hover {
			border: var(--border-secondary-hover);
			background-color: var(--secondary-hover);
		}
		&.active {
			background-color: var(--secondary-active);
			border: var(--border-secondary-active);
		}
	}
	main {
		display: flex;
		flex-direction: column;
		&.reverse {
			flex-direction: column-reverse;
		}
		overflow-y: auto;
	}
</style>
