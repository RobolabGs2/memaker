<script lang="ts">
	import ColorInput from './base/ColorInput.svelte';
	import NumberInput from './base/NumberInput.svelte';
	import type { Frame } from './meme';

	export let value: Frame;
</script>

<main>
	<section>Ширина<NumberInput bind:value={value.width} /></section>
	<section>Высота<NumberInput bind:value={value.height} /></section>
	<section>Фон<ColorInput bind:value={value.backgroundColor} /></section>
	<!-- <section>Альфа-канал<NumberInput
			bind:value={value.backgroundAlpha}
			min={0}
			max={1}
			step={0.05}
		/> 
	</section> -->
</main>

<style lang="scss">
	main {
		width: 100%;
		display: flex;
		justify-content: flex-end;
	}
	section {
		margin-right: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
</style>
