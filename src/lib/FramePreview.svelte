<script lang="ts">
	import { onMount } from 'svelte';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	export let index: number;
	export const updatePreview = (source: HTMLCanvasElement) => {

		const previewWidth = canvas.clientWidth;
		const previewScale = previewWidth / source.width;
		const previewHeight = (previewScale * source.height) | 0;
		if (canvas.width != previewWidth) canvas.width = previewWidth;
		if (canvas.height != previewHeight) canvas.height = previewHeight;
		ctx.fillStyle = `#${Math.ceil(Math.random()*0xFFFFFF).toString(16).padStart(6, "0")}`;
		ctx.fillRect(0, 0, previewWidth, previewHeight);
		// return
		// ctx.drawImage(source, 0, 0);
		// ctx.drawImage(source, 0, 0, previewWidth, previewHeight, 0, 0, previewWidth, previewHeight);
	};

	onMount(() => {
		ctx = canvas.getContext('2d')!;
	});
</script>

<article>
	<header>{index + 1}</header>
	<canvas bind:this={canvas} />
	<slot />
</article>

<style lang="scss">
	article {
		position: relative;
	}
	header {
		position: absolute;
		color: white;
		text-shadow: 0px 0px 4px black;
		font-weight: bold;
		top: 4px;
		left: 4px;
	}
	canvas {
		border-radius: 4px;
		width: 100%;
	}
</style>
