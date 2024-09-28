<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';
	import FileInput, { type EventMap } from './FileInput.svelte';

	export let accept: string | undefined = undefined;
	export let typeFilter = /.*/g;

	const dispatch = createEventDispatcher<EventMap>();

	function onDrop(ev: DragEvent) {
		ev.preventDefault();
		const items = ev.dataTransfer?.files;
		if (!items) return;
		const files = Array.from(items).filter((file) => file.type?.match(typeFilter));
		if (files.length) dispatch('change', files);
	}
</script>

<article on:dragover={(ev) => ev.preventDefault()} on:drop={onDrop}>
	<FileInput on:change {accept} {typeFilter}>
		<Button>Выберите файл</Button>
	</FileInput>
	<span> или перетащите сюда.</span>
</article>

<style>
	article {
		width: 100%;
		height: 96px;
		border: 1px dashed white;
		border-radius: 8px;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	span {
		margin-left: 7px;
	}
</style>
