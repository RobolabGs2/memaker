<script lang="ts">
	import { slide } from 'svelte/transition';
	import { IconChevronDown } from '@tabler/icons-svelte';
	let active = false;
	let mouseIn = false;

	export let css = {
		height: '48px',
		width: '100%',
		main: ''
	};
	let width = 0;
</script>

<main style={`height:${css.height};width:${css.width};${css.main}`}>
	<button
		style={`height:${css.height};width:${css.width};`}
		on:click={(ev) => {
			const rect = ev.currentTarget.getBoundingClientRect();
			width = rect.width;
			active = !active;
		}}
		on:focusout={() => setTimeout(() => (active = false), 100)}
	>
		<slot name="header" />
		<IconChevronDown />
	</button>
	{#if mouseIn || active}
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<article
			style={`width:${width}px;`}
			transition:slide={{ duration: 150 }}
			on:mouseover={() => (mouseIn = true)}
			on:mouseout={() => (mouseIn = false)}
		>
			<slot name="content" />
		</article>
	{/if}
</main>

<style lang="scss">
	main {
		position: relative;
		overflow: visible;
	}
	button {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		&:hover {
			border: var(--border-secondary-hover);
			background-color: var(--secondary-hover);
		}
		&:active {
			background-color: var(--secondary-active);
			border: var(--border-secondary-active);
		}
	}
	article {
		overflow: visible;
		position: fixed;
		z-index: 1;
		flex-direction: column;
		display: flex;
	}
</style>
