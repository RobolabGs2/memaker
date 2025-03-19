<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { ShaderInputDesc } from '$lib/graphics/shader';
	import UniformInputView from '$lib/graphics/ui/UniformInputView.svelte';

	export let value: ShaderInputDesc;
</script>

<InputGroup>
	<Label>Имя в коде <input bind:value={value.name} on:change /></Label>
	<Label>Имя в UI <input bind:value={value.title} on:change /></Label>
	<Label>Описание <textarea bind:value={value.description} on:change /></Label>
	<UniformInputView bind:value={value.input} on:change />
</InputGroup>
