<script lang="ts">
	import checkered from './resources/transparency_background.png';

	export let webgl: HTMLCanvasElement;
	export let ui: HTMLCanvasElement;
</script>

<article on:dragover on:drop>
	<canvas bind:this={webgl} style={`background-image: url(${checkered})`} />
	<canvas bind:this={ui} />
</article>

<style lang="scss">
	article {
		display: flex;
		height: 98%;
		position: relative;
		justify-content: center;
		overflow-y: auto;
	}

	canvas {
		flex: 1;
		position: absolute;
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	canvas:last-of-type {
		pointer-events: none;
		image-rendering: crisp-edges;
		image-rendering: pixelated;
	}
</style>
