<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let value: boolean;

	const dispatch = createEventDispatcher<{ input: boolean; change: boolean }>();
</script>

<main>
	<input
		type="checkbox"
		bind:checked={value}
		on:input={(ev) => dispatch('input', ev.currentTarget.checked)}
		on:change={(ev) => dispatch('change', ev.currentTarget.checked)}
	/>
	<span />
</main>

<!-- https://www.w3docs.com/snippets/css/how-to-style-a-checkbox-with-css.html -->
<style>
	main {
		display: block;
		position: relative;
		padding-left: 45px;
		margin-bottom: 15px;
		cursor: pointer;
		font-size: 20px;
	}
	input {
		display: none;
	}
	span {
		position: absolute;
		top: -5px;
		left: 0;
		height: 25px;
		width: 25px;
		background-color: var(--secondary);
		border: var(--border-secondary-hover);
		border-width: 2px;
		border-style: inset;
	}
	/* Specify the background color to be shown when hovering over checkbox */
	main:hover input ~ span {
		background-color: #5555ff;
	}
	/* Specify the background color to be shown when checkbox is active */
	main input:active ~ span {
		background-color: #4444dd;
	}
	/* Specify the background color to be shown when checkbox is checked */
	main input:checked ~ span {
		background-color: #4444ff;
	}
	/* Checkmark to be shown in checkbox */
	/* It is not be shown when not checked */
	span:after {
		content: '';
		position: absolute;
		display: none;
	}
	/* Display checkmark when checked */
	main input:checked ~ span:after {
		display: block;
	}
	/* Styling the checkmark using webkit */
	/* Rotated the rectangle by 45 degree and 
      showing only two border to make it look
      like a tickmark */
	main span:after {
		left: 7px;
		bottom: 5px;
		width: 6px;
		height: 10px;
		border: solid white;
		border-width: 0 3px 3px 0;
		-webkit-transform: rotate(45deg);
		-ms-transform: rotate(45deg);
		transform: rotate(45deg);
	}
</style>
