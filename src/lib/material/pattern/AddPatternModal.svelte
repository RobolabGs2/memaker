<script lang="ts">
	import Button from '$lib/base/Button.svelte';
	import FileReceiver from '$lib/base/FileReceiver.svelte';
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import Modal from '$lib/base/Modal.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let open = true;
	export let error = '';
	export let validateName: (name: string) => string = () => '';

	let file: File | null = null;
	let fileUrl = '';
	let name = '';

	function setFile(newFile: File) {
		if (file == newFile) return;
		if (fileUrl) {
			URL.revokeObjectURL(fileUrl);
			fileUrl = '';
		}
		file = newFile;
		if (file) {
			fileUrl = URL.createObjectURL(file);
			name = file.name.substring(0, file.name.lastIndexOf('.'));
		}
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
			if (file) setFile(file);
			else new Error('Failed to paste file');
			return;
		}
	}

	function onChangeFile(ev: CustomEvent<File[]>) {
		setFile(ev.detail[0]);
	}

	const dispatch = createEventDispatcher<{
		close: {
			action: 'cancel';
		};
		submit: {
			action: 'submit';
			name: string;
			image: File;
		};
	}>();

	function cancel(ev?: CustomEvent) {
		if (dispatch('close', { action: 'cancel' }, { cancelable: true })) {
			open = false;
			return;
		}
		ev?.preventDefault?.();
	}

	function submit() {
		if (!file) return;
		const validateMessage = validateName(name);
		if (validateMessage) {
			error = validateMessage;
			return;
		}
		if (dispatch('submit', { action: 'submit', image: file, name }, { cancelable: true })) {
			open = false;
			file = null;
			name = '';
			URL.revokeObjectURL(fileUrl);
			fileUrl = '';
		}
	}

	onMount(() => {
		return () => {
			if (fileUrl) URL.revokeObjectURL(fileUrl);
		};
	});
</script>

<Modal bind:open on:close={cancel} on:paste={(ev) => onPaste(ev.detail.event)}>
	<header slot="title">Добавить паттерн</header>
	<article>
		<InputGroup>
			<FileReceiver accept="image/*" typeFilter={/^image\//} on:change={onChangeFile} />
			{#if file}
				<section class="preview">
					<section>
						<Label {error}
							>Название <input
								bind:value={name}
								on:input={() => {
									error = validateName(name);
								}}
							/>
						</Label>
					</section>
					<section><img src={fileUrl} alt={name} /></section>
				</section>
			{/if}
		</InputGroup>
		<section>
			Добавленные паттерны пропадут между перезагрузками страницы, но их можно сохранить в .meme
			файле.
		</section>
	</article>
	<footer slot="footer">
		<Button width="128px" type="danger" on:click={() => cancel()}>Отмена</Button>
		<Button
			width="128px"
			type="primary"
			on:click={submit}
			style="margin-left:16px;"
			disabled={!name}
		>
			Добавить
		</Button>
	</footer>
</Modal>

<style lang="scss">
	article input {
		width: 128px;
	}
	article {
		height: 256px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	footer {
		display: flex;
		justify-content: flex-end;
		height: 48px;
	}
	img {
		height: 96px;
		width: fit-content;
		margin-left: auto;
		margin-right: auto;
	}
	.preview {
		display: flex;
		flex-wrap: wrap;
		& > section {
			padding: 8px;
			flex: 1;
		}
		& > section:last-child {
			display: flex;
			align-items: center;
			background-color: #00000099;
		}
	}
</style>
