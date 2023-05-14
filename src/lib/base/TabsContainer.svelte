<script lang="ts">
	type T = $$Generic;
	export let tabs: T[];
	export let activeTab: T = tabs[0];

	$: {
		if (!tabs.includes(activeTab)) activeTab = tabs[0];
	}
</script>

<article>
	<header>
		{#each tabs as tab}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<section class="tab" on:click={() => (activeTab = tab)} class:active={activeTab === tab}>
				<slot {tab} />
			</section>
		{/each}
	</header>
	{#each tabs as tab}
		<section class:hide={activeTab !== tab} class="content">
			<slot name="content" {tab} />
		</section>
	{/each}
</article>

<style lang="scss">
	article {
		padding-top: 4px;
		background-color: #1e1f1c88;
		overflow-y: auto;
		height: 70%;
	}
	header {
		display: flex;
	}
	.content {
		height: 90%;
		padding: 4px;
		/* border-left: var(--border-secondary-active); */
		/* border-right: var(--border-secondary-active); */
		/* border-bottom: var(--border-secondary-active); */
	}
	.hide {
		display: none;
	}
	.tab {
		user-select: none;
		flex: 1 1;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 4px;
		border-radius: 8px 8px 0 0;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		border-bottom: var(--border-secondary-active);
		&:hover {
			border: var(--border-secondary-hover);
			border-bottom: var(--border-secondary-active);
			background-color: var(--secondary-hover);
		}
		&.active,
		&:active {
			background-color: #1e1f1c;
		}
		&.active {
			border: var(--border-secondary-active);
			border-bottom: none;
		}
	}
</style>
