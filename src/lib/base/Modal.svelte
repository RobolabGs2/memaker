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
	}>();

	function closeModal(reason: ModalAction = 'cancel') {
		if (!closable) return;
		if (dispatch('close', { action: reason }, { cancelable: true })) open = false;
	}
	function exitOnEsc(ev: KeyboardEvent) {
		if (open && ev.key === 'Escape') closeModal('cancel');
	}
	onMount(() => {
		document.addEventListener('keyup', exitOnEsc);
		return () => document.removeEventListener('keyup', exitOnEsc);
	});
</script>

{#if open}
	<button class="backdrop fixed" on:click={() => closeModal('cancel')} />
	<div class="container fixed" on:keypress={exitOnEsc}>
		<article>
			{#if $$slots.title}
				<header>
					<slot name="title" />
					{#if closable}
						<Button width="auto" border={false} on:click={() => closeModal('cancel')}>
							<IconX />
						</Button>{/if}
				</header>
			{/if}
			<main><slot /></main>
			{#if $$slots.footer}
				<footer><slot name="footer" /></footer>
			{/if}
		</article>
	</div>
{/if}

<style lang="scss">
	.fixed {
		width: 100%;
		height: 100%;
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
	}
	.backdrop {
		background-color: #000000aa;
	}
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}
	article {
		pointer-events: all;
		background-color: var(--secondary);
		color: var(--text-secondary);
		border: var(--border-secondary);
		border-radius: 8px;

		width: 50%;
		max-width: 720px;
		min-height: 256px;
		max-height: 90%;

		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;

		header {
			height: 64px;
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
