<script lang="ts">
	import Button from './base/Button.svelte';
	import SvgIcon from './base/SvgIcon.svelte';
	import { BlockEditorMode } from './legacy/rectangle_editor';

	export let current: BlockEditorMode = BlockEditorMode.Cursor;
	export let available = [BlockEditorMode.Cursor];

	const cursorIconPath =
		'M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103zM2.25 8.184l3.897 1.67a.5.5 0 0 1 .262.263l1.67 3.897L12.743 3.52 2.25 8.184z';
	const cropIconPath =
		'M3.5.5A.5.5 0 0 1 4 1v13h13a.5.5 0 0 1 0 1h-2v2a.5.5 0 0 1-1 0v-2H3.5a.5.5 0 0 1-.5-.5V4H1a.5.5 0 0 1 0-1h2V1a.5.5 0 0 1 .5-.5zm2.5 3a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-1 0V4H6.5a.5.5 0 0 1-.5-.5z';
	const arrowsIconPath =
		'M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708l2-2zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10zM.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708l-2-2zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8z';

	const buttons = [
		{ icon: cursorIconPath, title: 'Указатель', value: BlockEditorMode.Cursor },
		{
			icon: arrowsIconPath,
			title: 'Модифицировать блок\n(для прямоугольных блоков)',
			value: BlockEditorMode.Move
		},
		{
			icon: cropIconPath,
			title: 'Обрезать изображение\n(для прямоугольных блоков)',
			value: BlockEditorMode.Crop
		}
	];
</script>

<article>
	{#each buttons as button}
		<Button
			title={button.title}
			on:click={() => {
				if (available.some((x) => x === button.value)) current = button.value;
			}}
			active={current === button.value}
			disabled={!available.some((x) => x === button.value)}
		>
			<SvgIcon type="bootstrap" path={button.icon} />
		</Button>
	{/each}
</article>

<style lang="scss">
	article {
		display: flex;
	}
</style>
