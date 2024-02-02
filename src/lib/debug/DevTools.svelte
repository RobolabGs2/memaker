<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import FrameSettings from '$lib/FrameSettings.svelte';
	import { defaultBlockSettings, type Memaker } from '$lib/memaker';
	import type { Block, Container, Frame, TextContent } from '$lib/meme';
	import { fontsNames, prepareFontFamilyInterpolationDataZIP } from '$lib/text/fonts_store';
	import { presets, applyStylePreset, defaultStyle } from '$lib/text/presets';
	import { CanvasTextMeasurer } from '$lib/text/manager';
	import { fontSettingsToKey, fontVariations, type TextMeasurer } from '$lib/text/metrics';
	import { saveBlob } from '$lib/utils';
	import { deepCopy } from '$lib/state';
	import TextContentSettings from '$lib/text/TextContentSettings.svelte';
	import NumberInput from '$lib/base/NumberInput.svelte';

	export let memaker: Memaker;
	let textContent: TextContent = {
		text: 'Широкая электрификация южных губерний\nдаст мощный толчок подъёму сельского хозяйства.',
		style: deepCopy(defaultStyle)
	};
	let frameSettings: Frame = {
		id: 'placeholer',
		backgroundAlpha: 1,
		backgroundColor: '#ffffff',
		height: 1080,
		width: 1920,
		blocks: []
	};
	let textMeasurer: TextMeasurer;
	let columns = 2;
	function generateData() {
		if (!textMeasurer) textMeasurer = new CanvasTextMeasurer();
		const fontFamily = textContent.style.font.family;
		prepareFontFamilyInterpolationDataZIP(textMeasurer, fontFamily).then(
			saveBlob(`${fontFamily}.zip`)
		);
	}
	function addBlocksGrig(
		frame: Frame,
		rows: number,
		columns: number,
		newBlock: (container: Container, i: number, row: number, col: number) => Block,
		count = rows * columns
	) {
		memaker.addFrame(frame);
		const frameWidth = frame.width;
		const frameHeight = frame.height;
		const blockHeight = frameHeight / rows;
		const blockWidth = frameWidth / columns;
		for (let i = 0; i < count; i++) {
			const row = i % rows | 0;
			const col = (i / rows) | 0;
			const container: Container = {
				type: 'rectangle',
				value: {
					height: blockHeight,
					width: 0.9 * blockWidth,
					position: {
						x: blockWidth / 2 + col * blockWidth,
						y: blockHeight / 2 + row * blockHeight
					},
					rotation: 0
				}
			};
			memaker.cloneBlock(newBlock(container, i, row, col));
		}
	}
	function fontTestFrame(family = textContent.style.font.family) {
		const variations = fontVariations(family);
		const rows = Math.ceil(variations.length / columns);
		addBlocksGrig(
			deepCopy(frameSettings),
			rows,
			columns,
			(container, i) => {
				const fontSettings = variations[i];
				const text = `${fontSettingsToKey(fontSettings).replaceAll('_', ' ')}\n${textContent.text}`;
				return {
					...defaultBlockSettings(),
					id: 'placeholder',
					container,
					content: {
						type: 'text',
						value: {
							text,
							style: {
								...deepCopy(textContent.style),
								font: fontSettings
							}
						}
					}
				};
			},
			variations.length
		);
	}
	function fontsTestFrame() {
		const fontsCount = $fontsNames.length;
		const rows = Math.ceil(fontsCount / columns);
		addBlocksGrig(
			deepCopy(frameSettings),
			rows,
			columns,
			(container, i) => {
				const family = $fontsNames[i];
				const text = `${family}\n${textContent.text}`;
				return {
					...defaultBlockSettings(),
					id: 'placeholder',
					container,
					content: {
						type: 'text',
						value: {
							text,
							style: {
								...deepCopy(textContent.style),
								font: {
									...deepCopy(textContent.style.font),
									family
								}
							}
						}
					}
				};
			},
			fontsCount
		);
	}
	function presetsTestFrame() {
		const presetsCount = $presets.length;
		const rows = Math.ceil(presetsCount / columns);
		addBlocksGrig(
			deepCopy(frameSettings),
			rows,
			columns,
			(container, i) => {
				const preset = $presets[i];
				const text = `${preset.name}\n${textContent.text}`;
				return {
					...defaultBlockSettings(),
					id: 'placeholder',
					container,
					content: {
						type: 'text',
						value: {
							text,
							style: applyStylePreset(preset, deepCopy(textContent.style))
						}
					}
				};
			},
			presetsCount
		);
	}
</script>

<main>
	<section>
		<Button type="primary" on:click={() => fontTestFrame()}>Фрейм с вариациями шрифта</Button>
		<Button type="primary" on:click={() => $fontsNames.forEach((family) => fontTestFrame(family))}>
			Фреймы для всех шрифтов
		</Button>
	</section>
	<section>
		<Button type="primary" on:click={fontsTestFrame}>Фрейм со шрифтами</Button>
		<Button type="primary" on:click={presetsTestFrame}>Фрейм с пресетами</Button>
	</section>
	<section>
		<section>Колонки: <NumberInput bind:value={columns} /></section>
		<FrameSettings bind:value={frameSettings} />
	</section>
	<TextContentSettings bind:content={textContent} />
	<Button type="danger" on:click={generateData}>Сгенерировать данные для шрифта</Button>
</main>

<style lang="scss">
	section {
		display: flex;
	}
</style>
