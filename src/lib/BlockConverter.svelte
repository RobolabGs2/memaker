<script lang="ts">
	import {
		IconBoxAlignBottom,
		IconBoxAlignTop,
		IconRectangle,
		IconSettings,
		IconBoxMargin
	} from '@tabler/icons-svelte';
	import type { Block, Frame, FrameDrawer } from './meme';
	import Select from '$lib/base/Select.svelte';
	import type { TextStyle } from './text/text';
	export let style: TextStyle;
	export let block: Block;
	export let frame: Frame;
	export let iconSize = 16;
	export let frameDrawer: FrameDrawer;

	function onChange(ev: CustomEvent<{ value: string }>) {
		switch (ev.detail.value) {
			case 'Top': {
				const oldType: string = block.container.type;
				if (oldType !== 'global') {
					block.container.value = {
						maxWidth: 0.95,
						maxHeight: 0.4,
						minHeight: 0.1,
						textPadding: 2 / 9
					};
				}
				block.container.type = 'global';
				style.baseline = 'top';
				break;
			}
			case 'Bottom': {
				const oldType: string = block.container.type;
				if (oldType !== 'global') {
					block.container.value = {
						maxWidth: 0.95,
						maxHeight: 0.4,
						minHeight: 0.1,
						textPadding: 2 / 9
					};
				}
				block.container.type = 'global';
				style.baseline = 'bottom';
				break;
			}
			case 'Free': {
				block.container.value = frameDrawer.measureBlock(frame, block);
				block.container.type = 'rectangle';
				break;
			}
			case 'Reset': {
				block.container.value = {
					width: frame.width / 2,
					height: frame.height / 2,
					position: {
						x: frame.width / 2,
						y: frame.height / 2
					},
					rotation: 0
				};
				block.container.type = 'rectangle';
				style.baseline = 'middle';
				break;
			}
		}
	}
</script>

<Select
	css={{ height: `${iconSize + 16}px`, width: '100%', main: 'flex:1;' }}
	items={['Top', 'Bottom', 'Free', 'Reset', 'Custom']}
	placeholder={'Custom'}
	value={block.container.type == 'rectangle' && style.baseline == 'middle'
		? 'Reset'
		: block.container.type == 'rectangle'
		? 'Free'
		: block.container.type == 'global' && style.baseline == 'top'
		? 'Top'
		: block.container.type == 'global' && style.baseline == 'bottom'
		? 'Bottom'
		: 'Custom'}
	let:item
	on:change={onChange}
>
	{#if item == 'Top'}
		<div title="Сверху">
			<IconBoxAlignTop size={iconSize} />
		</div>
	{:else if item == 'Bottom'}
		<div title="Снизу">
			<IconBoxAlignBottom size={iconSize} />
		</div>
	{:else if item == 'Free'}
		<div title="Свободный блок">
			<IconRectangle size={iconSize} />
		</div>
	{:else if item == 'Reset'}
		<div title="Свободный блок со сбросом размеров">
			<IconBoxMargin size={iconSize} />
		</div>
	{:else if item == 'Custom'}
		<IconSettings size={iconSize} />
	{:else}
		{item}
	{/if}
</Select>
