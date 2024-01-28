<script lang="ts">
	type T = $$Generic;
	export let tabs: T[];
	export let activeTab: T = tabs[0];
	export let layout: 'vertical' | 'horizontal' = 'vertical';

	$: {
		if (!tabs.includes(activeTab)) activeTab = tabs[0];
	}
</script>

<article class={layout}>
	<header>
		{#each tabs as tab}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<section
				class={`tab ${layout}`}
				on:click={() => (activeTab = tab)}
				class:active={activeTab === tab}
			>
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
	article.horizontal {
		display: flex;
		& > header {
			background-color: #232323;
			width: 38px;
			padding-left: 4px;
			flex-direction: column;
			padding-top: 8px;
		}
	}
	article {
		padding-top: 4px;
		background-color: #424242;
		height: 70%;
	}
	header {
		display: flex;
	}
	.content {
		overflow-y: auto;
		height: 100%;
		width: 100%;
		padding-left: 4px;
		padding-right: 4px;
		padding-top: 4px;
		padding-bottom: 32px;
		border: solid 1px #202020;
		.horizontal > & {
			border-left: none;
		}
		.vertical > & {
			border-top: none;
		}
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
		border: solid 1px #202020;
		background-color: #2b2b2b;
		color: var(--text-secondary);
		&:hover {
			background-color: var(--secondary-hover);
		}
		&.active,
		&:active {
			background-color: #424242;
		}
		&.horizontal {
			border-right: none;
		}
		&.vertical {
			border-bottom: none;
		}
		&.horizontal {
			border-radius: 4px 0 0 4px;
			overflow: hidden;
			max-height: 32px;
			justify-content: center;
			align-items: center;
		}
	}
</style>
