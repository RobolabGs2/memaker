<script lang="ts">
	import InputGroup from './base/InputGroup.svelte';
	import Label from './base/Label.svelte';
	import NumberInput from './base/NumberInput.svelte';
	import PointInput from './base/PointInput.svelte';
	import Select from './base/Select.svelte';
	import { TextureManager } from './graphics/textures';
	import type { Container, Content } from './meme';

	export let container: Container;
	export let content: Content;
	export let textureManager: TextureManager;
	export let frameWidth: number;
	export let frameHeight: number;

	function changeType(to: Container['type']) {
		switch (content.type) {
			case 'text':
				switch (to) {
					case 'global':
						container.value = {
							maxWidth: 0.9,
							maxHeight: 0.4,
							minHeight: 0.1
						};
						container.type = 'global';
						return;
					case 'rectangle':
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
				break;
			case 'image':
				{
					const crop = content.value.crop;
					const image = textureManager.get(content.value.id);
					let width = crop.width * image.width;
					let height = crop.height * image.height;
					const ratio = width / height;
					if (ratio > 1 && width > frameWidth) {
						width = frameWidth;
						height = width / ratio;
					}
					if (ratio < 1 && height > frameHeight) {
						height = frameHeight;
						width = height * ratio;
					}
					switch (to) {
						case 'global':
							container.value = {
								maxWidth: 1,
								maxHeight: 1,
								minHeight: 0.0
							};
							container.type = 'global';
							return;
						case 'rectangle':
							container.value = {
								width,
								height,
								position: {
									x: width / 2,
									y: height / 2
								},
								rotation: 0
							};
							container.type = 'rectangle';
							return;
					}
				}
				break;
		}
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
			Фиксированный
		{:else if item == 'rectangle'}
			Свободный
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
					withRange
					rangeMin={-359}
					rangeMax={359}
					step={1}
					value={Math.round((container.value.rotation / Math.PI) * 180)}
					on:input={(ev) => {
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
					withRange={true}
					value={container.value.maxWidth * 100}
					on:input={(ev) => {
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
					withRange={true}
					value={container.value.maxHeight * 100}
					on:input={(ev) => {
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
					withRange={true}
					value={container.value.minHeight * 100}
					on:input={(ev) => {
						if (container.type !== 'global') return;
						container.value.minHeight = ev.detail / 100;
					}}
				/>
			</Label>
		</InputGroup>
	{/if}
</article>
