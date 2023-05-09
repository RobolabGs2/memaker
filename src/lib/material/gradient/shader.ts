import { parseColor } from '$lib/graphics/graphics';
import type { Color } from '../color/shader';
import fragmentShader from './gradient.frag?raw';

export interface Gradient4Settings {
	type: 'gradient4';
	color1: Color;
	color2: Color;
	color3: Color;
	color4: Color;
}

export const Gradient4Shader = {
	fragment: fragmentShader,
	uniforms(settings: Gradient4Settings) {
		return {
			colors: [
				parseColor(settings.color1),
				parseColor(settings.color2),
				parseColor(settings.color3),
				parseColor(settings.color4)
			].flat()
		};
	}
};
