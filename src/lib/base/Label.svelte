<label><slot /></label>

<style lang="scss">
	label {
		margin: 4px;
		display: flex;
		justify-content: space-between;
		align-items: center;
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
</style>
