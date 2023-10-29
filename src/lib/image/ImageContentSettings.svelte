<script lang="ts">
	import FileReceiver from '$lib/base/FileReceiver.svelte';
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';
	import PointInput from '$lib/base/PointInput.svelte';
	import type { ImageContent } from '.';

	export let content: ImageContent;
</script>

<InputGroup>
	<Label>Имя <input bind:value={content.name} /></Label>
	<FileReceiver accept="image/*" typeFilter={/^image\//} on:change />
	<br />
	Настройки текстурных координат (не стабильно)
	<Label>Центр<PointInput bind:value={content.crop.position} step={0.01} /></Label>
	<Label
		>Поворот<NumberInput
			withRange
			rangeMin={0}
			rangeMax={360}
			step={1}
			value={Math.round((content.crop.rotation / Math.PI) * 180)}
			on:input={(ev) => {
				content.crop.rotation = ((ev.detail % 360) / 180) * Math.PI;
			}}
		/>
	</Label>
	<Label>Ширина<NumberInput step={0.01} bind:value={content.crop.width} /></Label>
	<Label>Высота<NumberInput step={0.01} bind:value={content.crop.height} /></Label>
</InputGroup>
