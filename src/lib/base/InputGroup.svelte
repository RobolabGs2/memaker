<script lang="ts">
	import { slide } from 'svelte/transition';
</script>

<article transition:slide|local><slot /></article>

<style>
	article {
		display: flex;
		flex-direction: column;
		padding-left: 4px;
	}
</style>
