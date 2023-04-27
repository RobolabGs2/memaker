<script lang="ts">
	export let value: unknown;
	let content = '';
	$: content = JSON.stringify(value, undefined, 4);
</script>

<textarea
	value={content}
	rows={content?.split('\n')?.length || 1}
	on:change={(ev) => {
		try {
			value = JSON.parse(ev.currentTarget.value);
		} catch (e) {
			console.warn(e);
		}
	}}
/>

<style>
	textarea {
		width: 100%;
		color: inherit;
		background-color: inherit;
	}
</style>
