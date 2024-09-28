<script lang="ts">
	import { slide } from 'svelte/transition';
	import { IconChevronDown } from '@tabler/icons-svelte';
	import Button from './Button.svelte';

	export let title = '';
	export let type: 'default' | 'primary' | 'secondary' | 'danger' = 'default';
	export let hideOnClick = false;
	export let css = {
		height: '48px',
		width: '100%',
		main: ''
	};

	let active = false;
	let mouseIn = false;
	let width = 0;
	let maxHeight = 0;
	let bottom = 0;
	let left = 0;
</script>

<article style={`height:${css.height};width:${css.width};${css.main}`}>
	<Button
		{title}
		{type}
		style={`height:${css.height};width:${css.width};`}
		justifyContent="space-between"
		on:click={(ev) => {
			const target = ev.currentTarget;
			if (!target) throw new Error('Not found target for button in drop down');
			if (!(target instanceof HTMLElement))
				throw new Error('Target for button is not html element');
			const rect = target.getBoundingClientRect();
			const viewportHeight = visualViewport?.height || 720;
			width = rect.width;
			bottom = rect.bottom;
			left = rect.left;
			maxHeight = viewportHeight - bottom;
			active = !active;
		}}
		on:focusout={() => setTimeout(() => (active = false), 100)}
	>
		<slot name="header" />
		<IconChevronDown />
	</Button>
	{#if (mouseIn && !hideOnClick) || active}
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<section
			style={`max-height:${maxHeight}px;width:${width}px;left:${left}px;top:${bottom}px;`}
			transition:slide={{ duration: 150 }}
			on:mouseover={() => (mouseIn = true)}
			on:mouseout={() => (mouseIn = false)}
		>
			<slot name="content" />
		</section>
	{/if}
</article>

<style lang="scss">
	article {
		position: relative;
		overflow: visible;
	}
	section {
		overflow: auto;
		position: fixed;
		z-index: 1;
		flex-direction: column;
		display: flex;
	}
</style>
