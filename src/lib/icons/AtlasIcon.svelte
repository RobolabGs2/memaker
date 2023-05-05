<script lang="ts">
	export let atlasURL: string;
	export let atlasDescription: {
		cell: {
			width: number;
			height: number;
		};
		atlas: {
			width: number;
			height: number;
		};
		images: Record<string, { x: number; y: number }>;
	};
	export let name: string;
	export let size: number;

	let image: { x: number; y: number };
	let bgWidth: number, bgHeight: number;
	let bgX: number, bgY: number;
	$: {
		image = atlasDescription.images[name];
		bgWidth = (atlasDescription.atlas.width / atlasDescription.cell.width) * size;
		bgHeight = (atlasDescription.atlas.height / atlasDescription.cell.height) * size;
		bgX = size * image.x;
		bgY = size * image.y;
	}
</script>

<main
	style={`
width: ${size}px;
height: ${size}px;
background-image: url(${atlasURL});
background-size: ${bgWidth}px ${bgHeight}px;
background-position: -${bgX}px ${bgY}px;
`}
/>

<style>
	main {
		margin: 2px;
	}
</style>
