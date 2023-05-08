<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import Button from './Button.svelte';

	export let value: boolean;
	export let width = '';

	const dispatcher = createEventDispatcher<{ change: boolean }>();
</script>

<Button active={value} on:click={() => dispatcher('change', (value = !value))} {width}>
	<slot />
</Button>
