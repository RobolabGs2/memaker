<script lang="ts">
	export let active = false;
	export let disabled = false;
	export let type: 'default' | 'primary' | 'secondary' | 'danger' = 'default';
	export let style = '';
	export let title = '';
	export let disablePadding = false;
	export let justifyContent = 'center';
	export let border = true;
	export let width = '100%';
	export let height = '';
</script>

<main
	role="button"
	tabindex={1}
	{title}
	class:active
	class:disabled
	class:disablePadding
	class:border
	class={type}
	style={`justify-content:${justifyContent};width:${width};${height ? `${height};` : ''}${style};`}
	on:click
	on:mousemove
	on:mouseout
	on:mouseover
	on:mouseup
	on:mousedown
	on:mouseenter
	on:mouseleave
	on:touchstart|passive
	on:touchmove|passive
	on:touchcancel|passive
	on:touchend|passive
	on:keydown
	on:keyup
	on:focus
	on:focusin
	on:focusout
	on:blur
>
	<slot />
</main>

<style lang="scss">
	main {
		font-size: small;
		font-family: inherit;
		border-radius: 8px;
		cursor: pointer;
		user-select: none;
		display: flex;
		align-items: center;
		padding: 8px 8px;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: none;
		&:hover:not(.disabled) {
			background-color: var(--secondary-hover);
		}
		&.active:not(.disabled),
		&:active:not(.disabled) {
			background-color: var(--secondary-active);
		}
		&.disablePadding {
			padding: 0;
			margin: 0;
		}

		&.danger:hover:not(.disabled) {
			background-color: #aa0000;
		}

		&.primary {
			font-weight: bold;
			background-color: #4444dd;
			&:hover:not(.disabled) {
				background-color: #4444ff;
			}
		}

		&.border {
			border: var(--border-secondary);
			&:hover:not(.disabled) {
				border: var(--border-secondary-hover);
			}
			&.active:not(.disabled),
			&:active:not(.disabled) {
				border: var(--border-secondary-active);
			}
		}

		&.disabled {
			color: #aaaaaa;
			cursor: default;
		}
	}
</style>
