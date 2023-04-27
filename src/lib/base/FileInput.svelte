<script context="module" lang="ts">
	export interface EventMap {
		change: File[];
	}
</script>

<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let accept: string | undefined = undefined;
	export let typeFilter = /.*/;

	let className = '';
	export { className as class };

	const dispatch = createEventDispatcher<EventMap>();
</script>

<label class={className}>
	<slot>Выбрать файл...</slot>
	<input
		{accept}
		type="file"
		on:change={(ev) => {
			const items = ev.currentTarget.files;
			if (!items || items.length === 0) return;
			const filtered = Array.from(items).filter((file) => file.type?.match(typeFilter));
			if (filtered.length === 0) return;
			dispatch('change', filtered);
			ev.currentTarget.value = '';
		}}
	/>
</label>

<style lang="scss">
	input {
		display: none;
	}
	label {
		font: inherit;
	}
</style>
