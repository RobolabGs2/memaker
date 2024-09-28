<script lang="ts">
	export let error = '';
</script>

<article class:error>
	<slot />
	{#if error}
		<div>{error}</div>
	{/if}
</article>

<style lang="scss">
	article {
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

	article > :global(input),
	article > :global(select) {
		height: 24px;
	}
	article > :global(input) {
		width: 64px;
	}
	article > :global(select) {
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
