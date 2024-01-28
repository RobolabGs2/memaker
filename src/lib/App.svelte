<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { writable } from 'svelte/store';
	import ClipboardErrorModal from './ClipboardErrorModal.svelte';
	import MemeEditor from './MemeEditor.svelte';
	import Modal from './base/Modal.svelte';
	import ThemeContext from './base/ThemeContext.svelte';
	import { theme } from './base/theme_store';
	import type { BlockEditorState } from './legacy/rectangle_editor';
	import { BlockEditorMode, RectangleEditor } from './legacy/rectangle_editor';
	import { ClipboardItemError, Memaker, type FileImport, type SkinsMap } from './memaker';
	import type { Block, Frame, Meme } from './meme';
	import { StateStore } from './state';
	import { defaultStyle } from './text/presets';
	import { saveBlob } from './utils';
	import { EffectShaders } from './effect';
	import { MaterialShaders } from './material';
	import { patternsNames } from './material/pattern/store';

	export let patternUrls: FileImport[];
	export let placeholdersUrls: SkinsMap;
	export let memeURL: string | null = null;
	export let memeExampleURL: string;

	const meme = new StateStore<Meme>({
		frames: [
			{
				height: 300,
				width: 600,
				backgroundColor: '#ffffff',
				backgroundAlpha: 1,
				id: 'loading-placeholder',
				blocks: [
					{
						id: 'loading-block-placeholder',
						container: { type: 'global', value: { maxHeight: 0.9, maxWidth: 0.9, minHeight: 0 } },
						content: {
							type: 'text',
							value: {
								text: 'Loading...',
								style: defaultStyle
							}
						},
						effects: [],
						layer: { blendMode: 'normal', composeMode: 'source_over' }
					}
				]
			}
		]
	});
	const activeFrame = new StateStore<Frame>(meme.value.frames[0]);
	const activeBlock = new StateStore<Block>(
		activeFrame.value.blocks.find((b) => b.content.type == 'text')!
	);
	let activeFrameId = activeFrame.value.id;
	meme.subscribe(() => {
		activeFrameId = '';
	});
	activeFrame.subscribe((frame) => {
		if (activeFrameId == frame.id) return;
		activeFrameId = frame.id;
		activeBlock.set(
			frame.blocks.find((b) => b.content.type == 'text') || frame.blocks[frame.blocks.length - 1]
		);
	});

	const editorState = new StateStore<BlockEditorState>({
		available: [BlockEditorMode.Cursor],
		mode: BlockEditorMode.Cursor
	});

	let memaker: Memaker;
	let canvasWebgl: HTMLCanvasElement;
	let canvasUI: HTMLCanvasElement;
	let updatePreview = new StateStore({} as Record<string, (canvas: HTMLCanvasElement) => void>);
	let busy = writable('Собираем интерфейс...');
	let error = writable<unknown>(undefined);
	let skinKey = 'default';
	const shaders = {
		materials: MaterialShaders(patternsNames),
		effects: EffectShaders()
	};
	onMount(() => {
		try {
			skinKey = new URL(location.href).searchParams.get('skin') ?? skinKey;

			memaker = new Memaker(
				{ block: activeBlock, frame: activeFrame, meme, busy, previews: updatePreview, error },
				canvasWebgl,
				patternUrls,
				placeholdersUrls,
				skinKey,
				shaders
			);
			new RectangleEditor(
				canvasUI,
				canvasWebgl,
				meme,
				activeFrame,
				activeBlock,
				editorState,
				shaders.effects
			);

			if (memeURL) {
				tick()
					.then(() => fetch(memeURL!))
					.then((resp) => resp.blob())
					.then((blob) => memaker.openMeme(blob));
			}
		} catch (e: unknown) {
			$error = e;
		}

		return () => memaker.clear();
	});

	let showFirefoxCopyBlob: null | Blob = null;

	function frameToClipboard() {
		if (!memaker) return;
		memaker.copyFrameToClipboard().catch((err) => {
			if (err instanceof ClipboardItemError) showFirefoxCopyBlob = err.blob;
			else throw err;
		});
	}
</script>

<ThemeContext bind:theme={$theme}>
	<Modal open={$busy !== ''} closable={false}>
		<article>
			{$busy}
		</article>
	</Modal>
	<Modal open={$error !== undefined}>
		<svelte:fragment slot="title">У нас проблемы</svelte:fragment>
		<article>
			Произошла ошибка: {$error}.
		</article>
	</Modal>
	<ClipboardErrorModal bind:fallbackBlob={showFirefoxCopyBlob} />
	<MemeEditor
		effectsShaders={shaders.effects}
		version={import.meta.env.VITE_APP_VERSION}
		{memeExampleURL}
		frameDrawer={memaker?.drawer}
		bind:meme={$meme}
		bind:frame={$activeFrame}
		bind:block={$activeBlock}
		bind:editorState={$editorState}
		bind:canvasUI
		bind:canvasWebgl
		bind:previews={$updatePreview}
		on:openMeme={(ev) => memaker?.openMeme(ev.detail.file)}
		on:saveMeme={() => memaker?.exportMeme()?.then(saveBlob('meme.meme'))}
		on:renderMeme={() =>
			memaker?.renderMeme()?.then(({ ext, blob }) => saveBlob(`meme.${ext}`)(blob))}
		on:changeBackground={(ev) => memaker?.setBackground(ev.detail.file)}
		on:frameToClipboard={frameToClipboard}
		on:cloneBlock={(ev) => memaker?.cloneBlock(ev.detail.block)}
		on:createTextBlock={(ev) => memaker?.addTextBlock(ev.detail?.origin)}
		on:createImageBlock={(ev) => memaker?.addImageBlock(ev.detail.file)}
		on:modifyImageBlock={(ev) => memaker?.modifyImageBlock(ev.detail.block, ev.detail.file)}
		on:shiftBlock={(ev) => memaker?.shiftBlock(ev.detail.block, ev.detail.shift)}
		on:deleteBlock={(ev) => memaker?.deleteBlock(ev.detail.block)}
		on:createFrame={(ev) => memaker?.addFrame(ev.detail?.origin)}
		on:shiftFrame={(ev) => memaker?.shiftFrame(ev.detail.frame, ev.detail.shift)}
		on:deleteFrame={(ev) => memaker?.deleteFrame(ev.detail.frame)}
		on:framesFromImages={(ev) => memaker?.framesFromImages(ev.detail.files)}
		on:addPattern={(ev) => memaker?.addPattern(ev.detail.name, ev.detail.image)}
	/>
</ThemeContext>

<style lang="scss">
	article {
		flex: 1;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: x-large;
	}
</style>
