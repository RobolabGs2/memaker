<script lang="ts">
	import App from '$lib/App.svelte';
	import ExampleMeme from '../memes/docs.meme';
	import resources from '$lib/resources';
</script>

<App
	patternUrls={resources.patternUrls}
	placeholdersUrls={resources.placeholdersUrls}
	memeExampleURL={ExampleMeme}
/>
