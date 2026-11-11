import { NumberLayout } from '$lib/graphics/inputs';
import type { RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

export const BugleShader: RawShader = {
	title: 'Выпуклость',
	fragment,
	inputs: [
		{
			name: 'strength',
			title: 'Сила',
			input: {
				type: 'float',
				default: 0.5,
				min: 0,
				max: 1.5,
				step: 0.05,
				layout: NumberLayout.RANGE
			}
		},
		{
			name: 'radius',
			title: 'Радиус',
			input: {
				default: 50,
				type: 'float',
				min: 0,
				step: 1,
				layout: NumberLayout.NUMBER
			}
		},
		{
			name: 'center',
			title: 'Центр',
			input: {
				type: 'point',
				default: {
					type: 'frame',
					value: { x: 0.5, y: 0.5 }
				},
				color: '#0fff00'
			}
		}
	]
};
