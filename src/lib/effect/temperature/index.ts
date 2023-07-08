import { NumberLayout } from '$lib/graphics/inputs';
import type { RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

export const TemperatureShader: RawShader = {
	title: 'Температура',
	fragment,
	inputs: [
		{
			name: 'temperature',
			title: 'Температура',
			default: 6550,
			input: {
				type: 'float',
				min: 1000,
				max: 20000,
				step: 100,
				layout: NumberLayout.RANGE
			}
		},
		{
			name: 'strength',
			default: 1,
			title: 'Сила',
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
