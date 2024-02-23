<script lang="ts">
	export let size = 24;
</script>

<span
	class="icon"
	style={`
width: ${size}px;
min-width: ${size}px;
height: ${size}px;
min-height: ${size}px;
font-size: ${size - 12}px;
`}
>
	<span style="font-size: 18px;line-height: 12px;">по</span>
	<span style="font-size: 9px;line-height: 8px;">всей</span>
	<span style="font-size: 6px;line-height: 4px;">ширине</span>
</span>

<style lang="scss">
	.icon {
		border-radius: 4px;
		margin: 2px;
		display: flex;
		justify-content: center;
		align-items: center;
		font: normal normal normal 8px 'Tektur';
		flex-direction: column;
	}
</style>
