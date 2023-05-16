<script lang="ts" context="module">
	export interface EventsMap {
		createFrame: { origin: Frame } | undefined;
		shiftFrame: { frame: Frame; shift: -1 | 1 };
		deleteFrame: { frame: Frame };

		createBlock: { origin: Block } | undefined;
		shiftBlock: { block: Block; shift: -1 | 1 };
		deleteBlock: { block: Block };
		convertBlock: { block: Block; type: 'Top' | 'Bottom' | 'Free' };

		renderMeme: { meme: Meme };
		saveMeme: { meme: Meme };
		openMeme: { file: Blob };

		changeBackground: { file: File };
		frameToClipboard: { frame: Frame };
		framesFromImages: { files: File[] };

		addPattern: { name: string; image: File };
	}
	export type MemeEvent<K extends keyof EventsMap> = CustomEvent<EventsMap[K]>;
</script>

<script lang="ts">
	import TabsContainer from './base/TabsContainer.svelte';
	import PreviewsContainer from './PreviewsContainer.svelte';
	import Canvas from './Canvas.svelte';
	import TextContentSettings from './text/TextContentSettings.svelte';
	import TextContentPreview from './text/TextContentPreview.svelte';
	import PreviewActions from './PreviewActions.svelte';
	import FramePreview from './FramePreview.svelte';
	import ContainerSettings from './ContainerSettings.svelte';
	import {
		IconNewSection,
		IconPhoto,
		IconPhotoUp,
		IconPhotoDown,
		IconCopy,
		IconUpload,
		IconDeviceFloppy
	} from '@tabler/icons-svelte';
	import FileInput from './base/FileInput.svelte';
	import type { Block, Frame, Meme } from './meme';
	import { createEventDispatcher } from 'svelte';
	import { onMount } from 'svelte';
	import BlockConverter from './BlockConverter.svelte';
	import Contacts from './Contacts.svelte';
	import Button from './base/Button.svelte';
	import EffectInput from './effect/EffectInput.svelte';
	import type { EffectType, EffectSettings } from './effect';

	export let meme: Meme;
	export let frame: Frame;
	export let block: Block;
	export let previews: Record<string, (source: HTMLCanvasElement) => void> = {};
	export let canvasWebgl: HTMLCanvasElement;
	export let canvasUI: HTMLCanvasElement;
	export let version: string;
	export let memeExampleURL: string;

	const dispatch = createEventDispatcher<EventsMap>();

	function onChangeBackground(file: File) {
		dispatch('changeBackground', { file });
	}
	function onPaste(event: ClipboardEvent) {
		const inFocus = document.activeElement;
		if (inFocus instanceof HTMLInputElement || inFocus instanceof HTMLTextAreaElement) return;
		const items = event.clipboardData?.items;
		if (!items) return;
		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			if (!item.type?.match(/^image/)) continue;
			const file = item.getAsFile();
			if (file) onChangeBackground(file);
			else new Error('Failed to paste file');
			return;
		}
	}
	function preventDefault(ev: Event) {
		ev.preventDefault();
	}
	function onDrop(callback: (images: File[]) => void) {
		return (ev: DragEvent) => {
			ev.preventDefault();
			const items = ev.dataTransfer?.files;
			if (!items) return;
			const images = Array.from(items).filter((file) => file.type?.match(/^image/));
			if (images.length) callback(images);
		};
	}
	onMount(() => {
		document.addEventListener('paste', onPaste);
		document.addEventListener('dragover', preventDefault);
		document.addEventListener('drop', preventDefault);
		return () => {
			document.removeEventListener('paste', onPaste);
			document.removeEventListener('dragover', preventDefault);
			document.removeEventListener('drop', preventDefault);
		};
	});

	export const EffectDefaults: (frame: Frame, type: EffectType) => EffectSettings<EffectType> = (
		frame: Frame,
		type: EffectType
	) => {
		return (
			{
				noise: { type: 'noise', radius: 10, minAlpha: 0.5, maxAlpha: 1 },
				bugle: {
					type: 'bugle',
					center: { x: (frame.width / 2) | 0, y: (frame.height / 2) | 0 },
					radius: (Math.min(frame.width, frame.height) / 3) | 0,
					strength: 0.5
				},
				pinch: {
					type: 'pinch',
					center: { x: (frame.width / 2) | 0, y: (frame.height / 2) | 0 },
					radius: (Math.min(frame.width, frame.height) / 3) | 0,
					strength: 0.5
				},
				swirl: {
					type: 'swirl',
					center: { x: (frame.width / 2) | 0, y: (frame.height / 2) | 0 },
					radius: (Math.min(frame.width, frame.height) / 3) | 0,
					angle: 180
				},
				grayscale: { type: 'grayscale' },
				brightness_contrast: { type: 'brightness_contrast', brightness: 0, contrast: 0 },
				temperature: { type: 'temperature', temperature: 6550, strength: 1 }
			} as const
		)[type];
	};
</script>

<article>
	<section>
		<Button type="primary" justifyContent="flex-start" on:click={() => dispatch('createFrame')}>
			<IconNewSection /> <span>Новый фрейм</span>
		</Button>
		<PreviewsContainer
			height="50%"
			items={meme.frames}
			bind:active={frame}
			let:item
			let:index
			on:drop={onDrop((files) => dispatch('framesFromImages', { files }))}
		>
			<FramePreview {index} bind:updatePreview={previews[item.id]}>
				<PreviewActions
					up
					down
					remove
					copy
					value={item}
					on:up={() => dispatch('shiftFrame', { frame: item, shift: -1 })}
					on:down={() => dispatch('shiftFrame', { frame: item, shift: 1 })}
					on:remove={() => dispatch('deleteFrame', { frame: item })}
					on:copy={() => dispatch('createFrame', { origin: item })}
				/>
			</FramePreview>
		</PreviewsContainer>
		<Button
			type="primary"
			justifyContent="flex-start"
			on:click={() => dispatch('renderMeme', { meme })}
		>
			<IconPhotoDown size={24} /> <span>Скачать мем</span>
		</Button>
		<Button
			type="primary"
			justifyContent="flex-start"
			on:click={() => dispatch('saveMeme', { meme })}
		>
			<IconDeviceFloppy size={24} /> <span>Сохранить проект мема</span>
		</Button>
		<FileInput accept=".meme" on:change={(ev) => dispatch('openMeme', { file: ev.detail[0] })}>
			<Button type="primary" justifyContent="flex-start">
				<IconUpload size={24} /><span>Открыть проект мема</span>
			</Button>
		</FileInput>
		<Contacts
			{version}
			on:openExample={() =>
				fetch(memeExampleURL)
					.then((resp) => resp.blob())
					.then((blob) => dispatch('openMeme', { file: blob }))}
		/>
	</section>
	<section>
		<header class="controls">
			<FileInput
				accept="image/*"
				typeFilter={/^image\//}
				on:change={(ev) => onChangeBackground(ev.detail[0])}
			>
				<Button type="primary" justifyContent="flex-start">
					<IconPhotoUp size={24} /><span>Сменить фон</span>
				</Button>
			</FileInput>
			<Button
				type="primary"
				justifyContent="flex-start"
				on:click={() => dispatch('frameToClipboard', { frame })}
			>
				<IconCopy /><span>Копировать</span>
			</Button>
		</header>
		<header class="canvas">
			<Canvas
				bind:webgl={canvasWebgl}
				bind:ui={canvasUI}
				on:drop={onDrop((images) => dispatch('changeBackground', { file: images[0] }))}
			/>
		</header>
	</section>
	<section>
		<Button type="primary" justifyContent="flex-start" on:click={() => dispatch('createBlock')}>
			<IconNewSection /> <span>Новый блок</span>
		</Button>
		<PreviewsContainer height="25%" reverse items={frame.blocks} bind:active={block} let:item>
			{#if item.content.type == 'text'}
				{#if item.id == block.id && block.content.type == 'text'}
					<TextContentPreview content={block.content.value}>
						<PreviewActions
							up
							down
							remove
							value={item}
							on:up={() => dispatch('shiftBlock', { block: item, shift: 1 })}
							on:down={() => dispatch('shiftBlock', { block: item, shift: -1 })}
							on:remove={() => dispatch('deleteBlock', { block: item })}
							iconSize={20}
						>
							<BlockConverter
								{frame}
								bind:style={block.content.value.style}
								bind:container={block.container}
								iconSize={20}
							/>
						</PreviewActions>
					</TextContentPreview>
				{:else}
					<TextContentPreview content={item.content.value} />
				{/if}
			{:else}
				<div class="image-preview"><IconPhoto /> <span>Фон</span></div>
			{/if}
		</PreviewsContainer>
		<TabsContainer
			tabs={block.content.type === 'text' ? ['Текст', 'Контейнер', 'Эффекты'] : ['Эффекты']}
			let:tab
		>
			<span>{tab}</span>
			<div slot="content">
				{#if tab === 'Текст' && block.content.type == 'text'}
					<TextContentSettings bind:content={block.content.value} on:change on:addPattern />
				{:else if tab === 'Контейнер'}
					<ContainerSettings
						frameHeight={frame.height}
						frameWidth={frame.width}
						bind:container={block.container}
					/>
				{:else if tab === 'Эффекты'}
					<EffectInput
						defaults={(type) => EffectDefaults(frame, type)}
						bind:value={block.effects}
					/>
				{/if}
			</div>
		</TabsContainer>
	</section>
</article>

<style lang="scss">
	article {
		display: flex;
		justify-content: center;
		height: 100vh;
		width: 100vw;
		max-height: 100vh;
		max-width: 100vw;
		overflow: hidden;
	}
	section:nth-of-type(1) {
		flex: 3 1;
		position: relative;
		min-width: 200px;
	}
	section:nth-of-type(2) {
		flex: 15 1;
		background-color: #111;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	section:nth-of-type(3) {
		flex: 5 1;
		min-width: 300px;
		/* padding: 2px; */
		/* overflow: auto; */
		/* display: flex; */
		/* flex-direction: column; */
	}
	section {
		/* overflow: auto; */
		height: 100vh;
		max-height: 100vh;
	}
	.controls {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		width: 80%;
		& > :global(*) {
			flex: 1 1;
			max-width: 148px;
		}
	}
	.canvas {
		height: 100%;
		width: 100%;
	}
	span {
		padding-left: 8px;
		padding-right: 8px;
		text-align: left;
	}
	.image-preview {
		width: 100%;
		display: flex;
		justify-content: flex-start;
		align-items: center;
		margin: 4px;
		padding-left: 12px;
	}
</style>
