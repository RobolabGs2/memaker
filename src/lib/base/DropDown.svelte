<script lang="ts">
	import { slide } from 'svelte/transition';
	import { IconChevronDown } from '@tabler/icons-svelte';
	import Button from './Button.svelte';
	let active = false;
	let mouseIn = false;

	export let css = {
		height: '48px',
		width: '100%',
		main: ''
	};
	let width = 0;
	let bottom = 0;
	let left = 0;
</script>

<main style={`height:${css.height};width:${css.width};${css.main}`}>
	<Button
		style={`height:${css.height};width:${css.width};`}
		justifyContent="space-between"
		on:click={(ev) => {
			const target = ev.currentTarget;
			if (!target) throw new Error('Not found target for button in drop down');
			if (!(target instanceof HTMLElement))
				throw new Error('Target for button is not html element');
			const rect = target.getBoundingClientRect();

			width = rect.width;
			bottom = rect.bottom;
			left = rect.left;
			active = !active;
		}}
		on:focusout={() => setTimeout(() => (active = false), 100)}
	>
		<slot name="header" />
		<IconChevronDown />
	</Button>
	{#if mouseIn || active}
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<article
			style={`width:${width}px;left:${left}px;top:${bottom}px;`}
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
	article {
		overflow: visible;
		position: fixed;
		z-index: 1;
		flex-direction: column;
		display: flex;
	}
</style>
