<script lang="ts">
	import InputGroup from './base/InputGroup.svelte';
	import Label from './base/Label.svelte';
	import NumberInput from './base/NumberInput.svelte';
	import PointInput from './base/PointInput.svelte';
	import Select from './base/Select.svelte';
	import type { Container } from './meme';

	export let container: Container;
	export let frameWidth: number;
	export let frameHeight: number;

	function changeType(to: Container['type']) {
		if (to == 'global') {
			container.value = {
				maxWidth: 0.95,
				maxHeight: 0.4,
				minHeight: 0.1
			};
			container.type = 'global';
			return;
		}
		container.value = {
			width: frameWidth / 2,
			height: frameHeight / 2,
			position: {
				x: frameWidth / 2,
				y: frameHeight / 2
			},
			rotation: 0
		};
		container.type = 'rectangle';
		return;
	}

	const containerTypes = ['global', 'rectangle'] as const;
</script>

<article>
	<Select
		value={container.type}
		items={containerTypes}
		on:change={(ev) => changeType(ev.detail.value)}
		let:item
	>
		{#if item == 'global'}
			Глобальный
		{:else if item == 'rectangle'}
			Прямоугольник
		{:else}
			Что-то пошло не так...
		{/if}
	</Select>
	{#if container.type == 'rectangle'}
		<InputGroup>
			<Label>
				Позиция <PointInput bind:value={container.value.position} />
			</Label>
			<Label>Ширина <NumberInput bind:value={container.value.width} /></Label>
			<Label>Высота <NumberInput bind:value={container.value.height} /></Label>
			<Label>
				Поворот <NumberInput
					step={1}
					value={Math.round((container.value.rotation / Math.PI) * 180)}
					on:change={(ev) => {
						if (container.type !== 'rectangle') return;
						container.value.rotation = ((ev.detail % 360) / 180) * Math.PI;
					}}
				/>
			</Label>
		</InputGroup>
	{:else if container.type == 'global'}
		<InputGroup>
			<Label>
				Максимальная ширина (%): <NumberInput
					min={0}
					max={100}
					step={0.5}
					value={container.value.maxWidth * 100}
					on:change={(ev) => {
						if (container.type !== 'global') return;
						container.value.maxWidth = ev.detail / 100;
					}}
				/>
			</Label>
			<Label>
				Максимальная высота (%): <NumberInput
					min={0}
					max={100}
					step={0.5}
					value={container.value.maxHeight * 100}
					on:change={(ev) => {
						if (container.type !== 'global') return;
						container.value.maxHeight = ev.detail / 100;
					}}
				/>
			</Label>
			<Label>
				Минимальная высота (%): <NumberInput
					min={0}
					max={100}
					step={0.5}
					value={container.value.minHeight * 100}
					on:change={(ev) => {
						if (container.type !== 'global') return;
						container.value.minHeight = ev.detail / 100;
					}}
				/>
			</Label>
		</InputGroup>
	{/if}
</article>
