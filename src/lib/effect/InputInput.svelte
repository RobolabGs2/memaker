<script lang="ts">
	import InputGroup from '$lib/base/InputGroup.svelte';
	import Label from '$lib/base/Label.svelte';
	import type { ShaderInputDesc } from '$lib/graphics/shader';

	export let value: ShaderInputDesc;
</script>

<InputGroup>
	<Label>
		Юниформ: <input bind:value={value.name} />
	</Label>
	<Label>
		Имя в UI: <input bind:value={value.title} />
	</Label>
	<Label>
		Описание: <input bind:value={value.description}/>
	</Label>
</InputGroup>

