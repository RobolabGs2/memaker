<script lang="ts" context="module">
	export interface EventsMap {
		createFrame: { origin: Frame } | undefined;
		shiftFrame: { frame: Frame; shift: number };
		deleteFrame: { frame: Frame };

		createBlock: { origin: Block } | undefined;
		shiftBlock: { block: Block; shift: number };
		deleteBlock: { block: Block };
		convertBlock: { block: Block; type: 'Top' | 'Bottom' | 'Free' };

		renderMeme: { meme: Meme };
		saveMeme: { meme: Meme };
		openMeme: { file: Blob };

		changeBackground: { file: File };
		frameToClipboard: { frame: Frame };
		framesFromImages: { files: File[] };
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
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement)
			return;
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
</script>

<article>
	<section>
		<button class="new-block" on:click={() => dispatch('createFrame')}>
			<IconNewSection /> <span>Новый фрейм</span>
		</button>
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
		<button class="new-block" on:click={() => dispatch('renderMeme', { meme })}>
			<IconPhotoDown size={24} /> <span>Скачать мем</span>
		</button>
		<button class="new-block" on:click={() => dispatch('saveMeme', { meme })}>
			<IconDeviceFloppy size={24} /> <span>Сохранить проект мема</span>
		</button>
		<FileInput
			class="new-block"
			accept=".meme"
			on:change={(ev) => dispatch('openMeme', { file: ev.detail[0] })}
		>
			<IconUpload size={24} /><span>Открыть проект мема</span>
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
				class="new-block"
				accept="image/*"
				typeFilter={/^image\//}
				on:change={(ev) => onChangeBackground(ev.detail[0])}
			>
				<IconPhotoUp size={24} /><span>Сменить фон</span>
			</FileInput>
			<button class="new-block" on:click={() => dispatch('frameToClipboard', { frame })}>
				<IconCopy /><span>Копировать</span>
			</button>
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
		<button class="new-block" on:click={() => dispatch('createBlock')}>
			<IconNewSection /> <span>Новый блок</span>
		</button>
		<PreviewsContainer
			height="25%"
			reverse
			items={frame.blocks.filter((b) => b.content.type == 'text')}
			bind:active={block}
			let:item
		>
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
						>
							<BlockConverter
								{frame}
								bind:style={block.content.value.style}
								bind:container={block.container}
							/>
						</PreviewActions>
					</TextContentPreview>
				{:else}
					<TextContentPreview content={item.content.value} />
				{/if}
			{/if}
		</PreviewsContainer>
		<TabsContainer tabs={['Текст', 'Контейнер']} let:tab>
			<span>{tab}</span>
			<div slot="content">
				{#if tab === 'Текст' && block.content.type == 'text'}
					<TextContentSettings bind:content={block.content.value} on:change />
				{:else if tab === 'Контейнер'}
					<ContainerSettings
						frameHeight={frame.height}
						frameWidth={frame.width}
						bind:container={block.container}
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
		height: 100%;
	}
	section:nth-of-type(1) {
		flex: 3;
		position: relative;
	}
	section:nth-of-type(2) {
		flex: 15;
		background-color: #000000;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	section:nth-of-type(3) {
		flex: 5;
		padding: 2px;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	section {
		/* overflow: auto; */
		height: 100vh;
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
	:global(label.new-block),
	:global(button.new-block) {
		width: 100%;
		height: 40px;
		border-radius: 4px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: flex-start;
		background-color: #4444dd;
		font-family: inherit;
		font-size: small;
		font-weight: bold;
		color: var(--text-secondary);
		border: var(--border-secondary);
		padding: 8px 8px;
		&:hover {
			background-color: #4444ff;
		}
		& > span {
			padding-left: 8px;
		}
	}
</style>
