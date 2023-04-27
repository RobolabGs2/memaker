<script lang="ts">
	import {
		IconBrandGithubFilled,
		// IconBrandVk,
		IconHelp,
		IconHistory,
		IconInfoCircle
	} from '@tabler/icons-svelte';
	import { createEventDispatcher } from 'svelte';
	import Modal from './base/Modal.svelte';

	export let version: string;
	/*
	TODO: link to vk group
	info - full version + short description like 
	""
	changelog and help? help in first version is example
	*/
	const dispatch = createEventDispatcher<{
		openExample: undefined;
	}>();

	let showInfo = false;
	let showChangelog = false;
</script>

<main>
	<Modal bind:open={showInfo}>
		<svelte:fragment slot="title">О проекте</svelte:fragment>
		<p>
			Мемейкер — это онлайн-редактор интернет-мемов. Первоочерёдной задачей является удобное
			наложения текста на изображение.
		</p>
		<p>Версия: {version}</p>
	</Modal>
	<Modal bind:open={showChangelog}>
		<svelte:fragment slot="title">История версий</svelte:fragment>
		<p>
			Скоро changelog будет доступен здесь, но пока его можно посмотреть на <a
				target="_blank"
				rel="noreferrer"
				title="Changelog"
				href="https://github.com/RobolabGs2/memaker/blob/main/CHANGELOG.md">GutHub</a
			>.
		</p>
	</Modal>
	<header>Memaker&nbsp;{version}</header>
	<section>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div title="Открыть пример" on:click={() => dispatch('openExample')}><IconHelp /></div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div title="История версий приложения" on:click={() => (showChangelog = true)}>
			<IconHistory />
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div title="Полная информация о версии" on:click={() => (showInfo = true)}>
			<IconInfoCircle />
		</div>
		<a
			target="_blank"
			rel="noreferrer"
			title="GitHub репозиторий"
			href="https://github.com/RobolabGs2/memaker"
		>
			<IconBrandGithubFilled />
		</a>
		<!-- <a target="_blank" rel="noreferrer" title="Группа ВК" href="https://vk.com/...">
			<IconBrandVk />
		</a> -->
	</section>
</main>

<style lang="scss">
	main {
		position: absolute;
		width: 100%;
		height: 116px;
		bottom: 0;
		padding: 8px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		background-color: #4444dd;
	}
	header {
		font-family: Lobster;
		font-size: 20px;
	}
	section {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		justify-content: space-around;
		align-items: center;
		& > * {
			display: flex;
			padding: 4px;
			color: var(--text-secondary);
			&:hover {
				color: blue;
				cursor: pointer;
			}
		}
	}
	p {
		margin-bottom: 16px;
		a {
			color: wheat;
		}
	}
</style>
