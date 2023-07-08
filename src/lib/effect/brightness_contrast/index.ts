import { NumberLayout } from '$lib/graphics/inputs';
import type { RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

export const BrightnessContrastShader: RawShader = {
	title: 'Яркость и контраст',
	fragment,
	inputs: [
		{
			name: 'brightness',
			title: 'Яркость',
			default: 0,
			input: {
				type: 'float',
				min: -1,
				max: 1,
				step: 0.05,
				layout: NumberLayout.RANGE
			}
		},
		{
			name: 'contrast',
			title: 'Контраст',
			default: 0,
			input: {
				type: 'float',
				min: -1,
				max: 1,
				step: 0.05,
				layout: NumberLayout.RANGE
			}
		}
	]
};
