<script lang="ts">
	import {
		IconBoxAlignBottom,
		IconBoxAlignTop,
		IconRectangle,
		IconSettings
	} from '@tabler/icons-svelte';
	import type { Container, Frame } from './meme';
	import Select from '$lib/base/Select.svelte';
	import type { TextStyle } from './text/text';
	export let container: Container;
	export let style: TextStyle;
	export let frame: Frame;
	export let iconSize = 16;

	function onChange(ev: CustomEvent<{ value: string }>) {
		switch (ev.detail.value) {
			case 'Top': {
				const oldType: string = container.type;
				if (oldType !== 'global') {
					container.value = {
						maxWidth: 0.95,
						maxHeight: 0.4,
						minHeight: 0.1
					};
				}
				container.type = 'global';
				style.baseline = 'top';
				break;
			}
			case 'Bottom': {
				const oldType: string = container.type;
				if (oldType !== 'global') {
					container.value = {
						maxWidth: 0.95,
						maxHeight: 0.4,
						minHeight: 0.1
					};
				}
				container.type = 'global';
				style.baseline = 'bottom';
				break;
			}
			case 'Free': {
				container.value = {
					width: frame.width / 2,
					height: frame.height / 2,
					position: {
						x: frame.width / 2,
						y: frame.height / 2
					},
					rotation: 0
				};
				container.type = 'rectangle';
				style.baseline = 'middle';
				break;
			}
		}
	}
</script>

<Select
	css={{ height: '32px', width: '100%', main: 'flex:1;' }}
	items={['Top', 'Bottom', 'Free', 'Custom']}
	placeholder={'Custom'}
	value={container.type == 'rectangle' && style.baseline == 'middle'
		? 'Free'
		: container.type == 'global' && style.baseline == 'top'
		? 'Top'
		: container.type == 'global' && style.baseline == 'bottom'
		? 'Bottom'
		: 'Custom'}
	let:item
	on:change={onChange}
>
	{#if item == 'Top'}
		<IconBoxAlignTop size={iconSize} />
	{:else if item == 'Bottom'}
		<IconBoxAlignBottom size={iconSize} />
	{:else if item == 'Free'}
		<IconRectangle size={iconSize} />
	{:else if item == 'Custom'}
		<IconSettings size={iconSize} />
	{:else}
		{item}
	{/if}
</Select>
