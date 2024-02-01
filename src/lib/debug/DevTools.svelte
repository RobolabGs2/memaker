<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import Select from '$lib/base/Select.svelte';
	import { fontsNames, prepareFontFamilyInterpolationDataZIP } from '$lib/text/fonts_store';
	import { CanvasTextMeasurer } from '$lib/text/manager';
	import type { TextMeasurer } from '$lib/text/metrics';
	import { saveBlob } from '$lib/utils';

	let textMeasurer: TextMeasurer;
	let fontFamily = '';
	function generateData() {
		if (!textMeasurer) textMeasurer = new CanvasTextMeasurer();
		prepareFontFamilyInterpolationDataZIP(textMeasurer, fontFamily).then(
			saveBlob(`${fontFamily}.zip`)
		);
	}
</script>

<main>
	<section>
		<Button type="primary" disabled={!fontFamily} on:click={generateData}>
			Сгенерировать данные для шрифта
		</Button>
		<Select type="primary" bind:value={fontFamily} items={$fontsNames} let:item>
			{item || 'Выберите шрифт'}
		</Select>
	</section>
</main>

<style lang="scss">
	section {
		display: flex;
	}
</style>
