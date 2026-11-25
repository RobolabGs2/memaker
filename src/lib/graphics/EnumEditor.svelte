<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import type { UniformInput } from './inputs';
	import { IconPlus, IconTrash } from '@tabler/icons-svelte';
	export let values: UniformInput<'enum'>['values'];
</script>

<article>
	<table>
		<tr>
			<th>Название UI</th>
			<th title="Итог строится НАЗВАНИЕ_В_КОДЕ_НАЗВАНИЕ_ЮНИФОРМА"> В коде </th>
			<th>Значение</th>
		</tr>
		{#each values as value (values.indexOf(value))}
			<tr>
				<td><input bind:value={value.title} /></td>
				<td><input bind:value={value.name} /></td>
				<td>
					<NumberInput bind:value={value.value} withButtons={false} />
				</td>
				<td>
					<Button
						disabled={values.length === 1}
						type="danger"
						on:click={() => {
							if (values.length === 1) return;
							values.splice(values.indexOf(value), 1);
							values = values;
						}}><IconTrash size={16} /></Button
					>
				</td>
			</tr>
		{/each}
	</table>
	<Button
		type="primary"
		on:click={() => {
			values.push({ title: '', name: `U${values.length}`, value: values.length });
			values = values;
		}}><IconPlus size={16} /></Button
	>
</article>

<style lang="scss">
	input {
		max-width: 128px;
	}
</style>
