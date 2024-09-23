<script lang="ts">
	import DropDown from '$lib/base/DropDown.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';

	export let value: number;
</script>

<DropDown
	title="Междустрочный интервал в кол-ве строк"
	css={{ height: '48px', main: 'min-width:156px;flex: 1', width: '100%' }}
>
	<svelte:fragment slot="header">
		<NumberInput width="60px" bind:value min={-1} step={0.125} precision={3} />
	</svelte:fragment>
	<section slot="content" class="values">
		{#each [0, 0.5, 1, 1.25] as v}
			<label>
				<input type="radio" bind:group={value} value={v} style="display: none;" />
				{v}
			</label>
		{/each}
	</section>
</DropDown>

<style lang="scss">
	.values {
		background-color: var(--secondary);
		color: var(--text-secondary);
		display: flex;
		flex-direction: column;
		& > label {
			font-size: 12px;
			padding: 8px 4px;
			background-color: var(--secondary);
			color: var(--text-secondary);
			border: var(--border-secondary);
			&:hover {
				border: var(--border-secondary-hover);
				background-color: var(--secondary-hover);
			}
			&:active {
				background-color: var(--secondary-active);
				border: var(--border-secondary-active);
			}
		}
	}
</style>
