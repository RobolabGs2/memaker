<script lang="ts">
	import { onDestroy } from 'svelte';
	import Modal from './base/Modal.svelte';
	import HelpImage from './resources/firefox_copy_helper.jpg';

	export let fallbackBlob: Blob | null = null;
	let blob = fallbackBlob;
	let url = '';

	$: {
		if (fallbackBlob != blob) {
			if (url) URL.revokeObjectURL(url);
			blob = fallbackBlob;
			url = blob ? URL.createObjectURL(blob) : '';
		}
	}
	onDestroy(() => {
		if (url) URL.revokeObjectURL(url);
	});
</script>

<Modal open={fallbackBlob != null} on:close={() => (fallbackBlob = null)}>
	<svelte:fragment slot="title">Ваш браузер не поддерживает копирование</svelte:fragment>
	<article>
		<p>
			Ваш браузер отключил или не поддерживает копирование изображений из скриптов. Вы можете
			скопировать эту копию фрейма вручную с помощью ПКМ.
		</p>
		<img src={url} alt="Копия фрейма" />
		<p>
			Если это Firefox версии 87 и выше, вы можете включить опцию <span>
				dom.events.asyncClipboard.clipboardItem</span
			>, открыв в новой вкладке страницу <span>about:config</span>. Тогда вы перестанете видеть это
			окно, а функционал копирования заработает корректно.
		</p>
		<img src={HelpImage} alt="Скриншот страницы about:config" />
	</article>
</Modal>

<style>
	article {
		height: 100%;
		display: flex;
		align-items: center;
		flex-direction: column;
		justify-content: space-between;
	}
	img {
		padding: 8px;
		max-height: 156px;
	}
	span {
		font-family: monospace;
		font-weight: bolder;
		font-size: large;
	}
</style>
