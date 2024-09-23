<script lang="ts">
	export let error = '';
</script>

<main class:error>
	<slot />
	{#if error}
		<div>{error}</div>
	{/if}
</main>

<style lang="scss">
	main {
		position: relative;
		padding-top: 4px;
		padding-bottom: 4px;
		margin-bottom: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;

		&.error {
			border-radius: 4px 0px 4px 4px;
			border: 1px var(--text-error) solid;
		}
		& > :global(:nth-child(1)) {
			width: 50%;
		}
		& > :global(:nth-child(2)) {
			width: 50%;
		}
	}

	main > :global(input),
	main > :global(select) {
		height: 24px;
	}
	main > :global(input) {
		width: 64px;
	}
	main > :global(select) {
		width: 128px;
	}
	div {
		border: 1px var(--text-error) solid;
		color: var(--text-error);
		background-color: #000000;
		border-radius: 4px 4px 0px 0px;
		padding: 4px;
		position: absolute;
		bottom: 32px;
		left: 0;
	}
</style>
