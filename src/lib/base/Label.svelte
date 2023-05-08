<script lang="ts">
	export let error = '';
	let forAnchor: string | undefined = undefined;
	export { forAnchor as for };
</script>

<label class:error for={forAnchor}
	><slot />
	{#if error}
		<div>{error}</div>
	{/if}
</label>

<style lang="scss">
	label {
		position: relative;
		padding: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;

		&.error {
			border-radius: 4px 0px 4px 4px;
			border: 1px var(--text-error) solid;
		}
	}

	label > :global(input),
	label > :global(select) {
		height: 24px;
	}
	label > :global(input) {
		width: 64px;
	}
	label > :global(select) {
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
