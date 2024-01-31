<script lang="ts">
	const types = {
		mdi: {
			size: 24,
			viewbox: '0 0 24 24'
		},
		bootstrap: {
			size: 24,
			viewbox: '0 0 16 16'
		},
		'simple-icons': {
			size: 24,
			viewbox: '0 0 24 24'
		},
		default: {
			size: 0,
			viewbox: '0 0 0 0'
		}
	};

	export let type: null | keyof typeof types = null;
	export let path: string;
	export let size: null | number = null;
	export let viewbox: null | string = null;
	export let flip: 'none' | 'vertical' | 'horizontal' = 'none';
	export let rotate = 0;

	$: defaults = type ? types[type] : types.default;
	$: sizeValue = size || defaults.size;
	$: viewboxValue = viewbox || defaults.viewbox;
	$: sx = ['both', 'horizontal'].includes(flip) ? '-1' : '1';
	$: sy = ['both', 'vertical'].includes(flip) ? '-1' : '1';
	$: r = isNaN(rotate) ? rotate : rotate + 'deg';
</script>

<svg
	width={sizeValue}
	height={sizeValue}
	viewBox={viewboxValue}
	style="--sx: {sx}; --sy: {sy}; --r: {r}"
	{...$$restProps}
>
	<path d={path} />
</svg>

<style>
	svg {
		transform: rotate(var(--r, 0deg)) scale(var(--sx, 1), var(--sy, 1));
	}

	path {
		fill: currentColor;
	}
</style>
