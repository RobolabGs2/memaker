<script lang="ts">
	import { IconMinus, IconPlus } from '@tabler/icons-svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let value: number;
	export let min = -Infinity;
	export let max = Infinity;
	export let step = 1;
	export let ctrlMultiplier = 2;
	export let shiftMultiplier = 5;
	// TODO: change event on finish button clicks
	const dispatch = createEventDispatcher<{ input: number; change: number }>();

	let changeTimer = -1;
	let intervalStarted = false;
	function stopInterval(ev?: MouseEvent) {
		if ((!ev || ev.button === 0) && changeTimer !== -1) {
			clearInterval(changeTimer);
			intervalStarted = false;
		}
	}
	function multiplier(ev: MouseEvent): number {
		let m = 1;
		if (ev.ctrlKey) m *= ctrlMultiplier;
		if (ev.shiftKey) m *= shiftMultiplier;
		return m;
	}
	function deltaChange(delta: number) {
		value = Math.min(max, Math.max(min, value + delta));
		dispatch('input', value);
		dispatch('change', value);
	}
	function initInterval(delta: number) {
		stopInterval();
		changeTimer = setInterval(() => {
			intervalStarted = true;
			deltaChange(delta);
		}, 150) as unknown as number; // use dom api, not node.js
	}
	onMount(() => {
		document.addEventListener('mouseup', stopInterval);
		return () => document.removeEventListener('mouseup', stopInterval);
	});

	const title = `Шаг: ${step}\nCtrl: x${ctrlMultiplier}\nShift: x${shiftMultiplier}`;
</script>

<main>
	<input
		value={value.toString()}
		on:input={(ev) => {
			const rawValue = Number(ev.currentTarget.value);
			if (Number.isNaN(rawValue)) {
				ev.currentTarget.value = value.toString();
				return;
			}
			value = Math.min(max, Math.max(min, rawValue));
			dispatch('input', value);
		}}
		on:change={(ev) => dispatch('change', Number(ev.currentTarget.value))}
	/>
	<footer>
		<button
			{title}
			on:mousedown={(ev) => {
				if (ev.button != 0) return;
				initInterval(-multiplier(ev) * step);
			}}
			on:mouseup={(ev) => {
				if (ev.button != 0) return;
				if (intervalStarted) return;
				deltaChange(-multiplier(ev) * step);
			}}
		>
			<IconMinus />
		</button>
		<button
			{title}
			on:mousedown={(ev) => {
				if (ev.button != 0) return;
				initInterval(+multiplier(ev) * step);
			}}
			on:mouseup={(ev) => {
				if (ev.button != 0) return;
				if (intervalStarted) return;
				deltaChange(+multiplier(ev) * step);
			}}
		>
			<IconPlus />
		</button>
	</footer>
</main>

<style lang="scss">
	main {
		display: flex;
		flex-wrap: wrap;
	}
	footer {
		display: flex;
	}
	input {
		width: 48px;
	}
	button {
		margin: 0;
		padding: 0;
		display: flex;
	}
</style>
