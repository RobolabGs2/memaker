import { NumberLayout } from '$lib/graphics/inputs';
import type { RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

export const BugleShader: RawShader = {
	title: 'Выпуклость',
	fragment,
	inputs: [
		{
			name: 'strength',
			default: 0.5,
			title: 'Сила',
			input: {
				type: 'float',
				min: 0,
				max: 1.5,
				step: 0.05,
				layout: NumberLayout.RANGE
			}
		},
		{
			name: 'radius',
			default: 50,
			title: 'Радиус',
			input: {
				type: 'float',
				min: 0,
				step: 1
			}
		},
		{
			name: 'center',
			default: {
				type: 'frame',
				value: { x: 0.5, y: 0.5 }
			},
			title: 'Центр',
			input: {
				type: 'point',
				color: '#0fff00'
			}
		}
	]
};
