import { parseColor } from '$lib/graphics/graphics';
import fragmentShader from './color.frag?raw';
import type { MaterialSettings } from './material';

export const ColorShader = {
	fragment: fragmentShader,
	uniforms(settings: MaterialSettings<'color'>) {
		return {
			color: parseColor(settings.value)
		};
	}
};
