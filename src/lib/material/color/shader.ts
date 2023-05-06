import { parseColor } from '$lib/graphics/graphics';
import type { MaterialSettings } from '$lib/material';
import fragmentShader from './color.frag?raw';

export const ColorShader = {
	fragment: fragmentShader,
	uniforms(settings: MaterialSettings<'color'>) {
		return {
			color: parseColor(settings.value)
		};
	}
};
