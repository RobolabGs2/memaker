<script lang="ts">
	import {
		IconBrandGithubFilled,
		IconBrandVk,
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
	let iconsSize = 24;
</script>

<main>
	<Modal bind:open={showInfo}>
		<svelte:fragment slot="title">О проекте</svelte:fragment>
		<p>
			Мемейкер – редактор мемов прямо в браузере. В первую очередь он разрабатывался как простое
			средство наложения текста с обводкой на картинку. С его помощью можно быстро создать типичный
			мем с импактом и обводкой, обыграть постиронию лобстером с тенью или набросать
			многокартиночный мем, не мучаясь со слоями или кучей разных файлов в графическом редакторе.
		</p>
		<p>
			Стабильная версия доступна по адресу <a
				href="https://robolabgs2.github.io/memaker/"
				target="_blank"
				rel="noreferrer"
				title="Стабильная версия">https://robolabgs2.github.io/memaker/</a
			>
			Самая же свежая версия доступна здесь:
			<a
				href="https://robolabgs2.github.io/memaker-prerelease/"
				target="_blank"
				rel="noreferrer"
				title="Последняя версия">https://robolabgs2.github.io/memaker-prerelease/</a
			>. Нулевая версия редактора увидела свет 24 августа 2022 года, с тех пор редактор
			разрабатывается одним человеком в свободное время. Пожаловаться на баги или запросить фичу
			можно в обсуждениях
			<a target="_blank" rel="noreferrer" title="Группа ВК" href="https://vk.com/memaker_app"
				>в группе ВК</a
			>
			или через issue
			<a
				target="_blank"
				rel="noreferrer"
				title="GitHub репозиторий"
				href="https://github.com/RobolabGs2/memaker">на гитхабе</a
			>.
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
				href="https://github.com/RobolabGs2/memaker/blob/main/CHANGELOG.md">GitHub</a
			>.
		</p>
	</Modal>
	<header>Memaker&nbsp;{version}</header>
	<section>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div title="Открыть пример" on:click={() => dispatch('openExample')}>
			<IconHelp size={iconsSize} />
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div title="История версий приложения" on:click={() => (showChangelog = true)}>
			<IconHistory size={iconsSize} />
		</div>
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<div title="О проекте" on:click={() => (showInfo = true)}>
			<IconInfoCircle size={iconsSize} />
		</div>
		<a
			target="_blank"
			rel="noreferrer"
			title="GitHub репозиторий"
			href="https://github.com/RobolabGs2/memaker"
		>
			<IconBrandGithubFilled size={iconsSize} />
		</a>
		<a target="_blank" rel="noreferrer" title="Группа ВК" href="https://vk.com/memaker_app">
			<IconBrandVk size={iconsSize} />
		</a>
	</section>
</main>

<style lang="scss">
	main {
		position: absolute;
		width: 100%;
		height: 124px;
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
			padding-left: 8px;
			padding-right: 8px;
			color: var(--text-secondary);
			&:hover {
				color: lime;
				cursor: pointer;
			}
		}
	}
	p {
		margin-bottom: 16px;
		a {
			color: wheat;
			&:hover {
				color: lime;
			}
		}
	}
</style>
