<script lang="ts">
	type T = $$Generic;
	export let tabs: T[];
	export let activeTab: T = tabs[0];
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
		<section class:hide={activeTab !== tab}>
			<slot name="content" {tab} />
		</section>
	{/each}
</article>

<style lang="scss">
	article {
		background-color: #1e1f1c;
		height: 100%;
		flex: 1 1;
		overflow-y: auto;
	}
	header {
		display: flex;
	}
	section {
		height: 80%;
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
		border-radius: 4px 4px 0 0;
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
