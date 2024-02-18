<script lang="ts">
	import { IconX } from '@tabler/icons-svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import Button from './Button.svelte';

	export let open = true;
	export let closable = true;
	type ModalAction = 'cancel';
	const dispatch = createEventDispatcher<{
		close: {
			action: ModalAction;
		};
		paste: {
			event: ClipboardEvent;
		};
	}>();

	function closeModal(reason: ModalAction = 'cancel') {
		if (!closable) return;
		if (dispatch('close', { action: reason }, { cancelable: true })) open = false;
	}
	onMount(() => {
		return () => {
		};
	});
	const windowPos = { x: 0, y: 0 };
	function onMouseMoveHandler(ev: MouseEvent) {
		const fromX = ev.pageX;
		const fromY = ev.pageY;
		const { x, y } = windowPos;
		return function (ev: MouseEvent) {
			ev.preventDefault();
			const deltaX = ev.pageX - fromX;
			const deltaY = ev.pageY - fromY;
			windowPos.x = x + deltaX;
			windowPos.y = y + deltaY;
		};
	}
	function dragHeader(ev: MouseEvent) {
		if (ev.target !== ev.currentTarget) return;
		const handler = onMouseMoveHandler(ev);
		document.addEventListener('mousemove', handler);
		document.addEventListener('mouseup', () => document.removeEventListener('mousemove', handler), {
			once: true
		});
	}
</script>

{#if open}
	<!-- <div class="container fixed" on:keypress={exitOnEsc}> -->
	<article style="left:{windowPos.x}px;top:{windowPos.y}px;">
		<header on:mousedown={dragHeader}>
			<slot name="title">Окно</slot>
			{#if closable}
				<Button title="Закрыть" width="auto" border={false} on:click={() => closeModal('cancel')}>
					<IconX />
				</Button>{/if}
		</header>
		<main><slot /></main>
		{#if $$slots.footer}
			<footer><slot name="footer" /></footer>
		{/if}
	</article>
	<!-- </div> -->
{/if}

<style lang="scss">
	// .fixed {
	// 	width: 100%;
	// 	height: 100%;
	// 	position: fixed;
	// 	top: 0;
	// 	bottom: 0;
	// 	left: 0;
	// 	right: 0;
	// 	z-index: 100;
	// }
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}
	article {
		z-index: 50;
		position: absolute;
		line-height: 1.4em;
		pointer-events: all;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		border-radius: 8px;

		width: 50%;

		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;

		header {
			height: 32px;
			padding: 16px;
			width: 100%;
			display: flex;
			justify-content: space-between;
			align-items: center;

			font-weight: bold;
			border-bottom: 1px #ffffff44 solid;
		}

		main {
			padding: 20px;
			width: 100%;
			flex: 1 1 100%;
			overflow-y: auto;
			display: flex;
			flex-direction: column;
			justify-content: center;
		}

		footer {
			border-top: 1px #ffffff44 solid;
			width: 100%;
			min-height: 64px;
			padding: 16px;
		}
	}
</style>
