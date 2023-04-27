<script lang="ts" context="module">
	export interface Theme {
		textSecondary: string;
		secondary: string;
		secondaryHover: string;
		secondaryActive: string;
		border: string;
		borderSecondary: string;
		borderSecondaryHover: string;
		borderSecondaryActive: string;
	}
	function themeToCss(theme: Theme) {
		return Object.entries(theme)
			.map(([key, value]) => {
				const k = key
					.split(/(?<=[a-z])(?=[A-Z])/)
					.map((x) => x.toLowerCase())
					.join('-');
				return `--${k}: ${value};`;
			})
			.join('');
	}
</script>

<script lang="ts">
	export let theme: Theme;
</script>

<div style={themeToCss(theme)}>
	<slot />
</div>

<style lang="scss">
	/* Works on Firefox */
	:global(*) {
		scrollbar-width: thin;
		scrollbar-color: var(--text-secondary) var(--secondary);
	}

	/* Works on Chrome, Edge, and Safari */
	:global(*)::-webkit-scrollbar {
		width: 12px;
	}

	:global(*)::-webkit-scrollbar-track {
		background: var(--secondary);
	}

	:global(*)::-webkit-scrollbar-thumb {
		background-color: var(--text-secondary);
		border-radius: 20px;
		border: 3px solid var(--secondary);
	}
	:global(button) {
		padding: 8px 8px;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		&:hover {
			border: var(--border-secondary-hover);
			background-color: var(--secondary-hover);
		}
		&:active {
			border: var(--border-secondary-active);
			background-color: var(--secondary-active);
		}
	}
	:global(input),
	:global(textarea) {
		padding: 4px;
	}
	:global(input),
	:global(select) {
		background-color: var(--secondary);
		color: var(--text-secondary);
		&:hover {
			background-color: var(--secondary-hover);
		}
	}
	div {
		font-family: Arial, Helvetica, sans-serif;
		background-color: var(--secondary);
		color: var(--text-secondary);
	}
</style>
