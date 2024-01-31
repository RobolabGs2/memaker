<script lang="ts">
	export let size = 24;
</script>

<span
	class="icon"
	style={`
width: ${size - 4}px;
min-width: ${size - 4}px;
height: ${size - 4}px;
min-height: ${size - 4}px;
font-size: ${size - 12}px;
`}>Тт</span
>

<style lang="scss">
	.icon {
		border-radius: 4px;
		border: solid white 2px;
		margin: 2px;
		display: flex;
		justify-content: center;
		align-items: center;
		font: normal normal bold 14px 'Helvetica';
	}
</style>
