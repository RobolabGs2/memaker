import { AngleShaderMode } from '$lib/graphics/inputs';
import type { RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

export const SwirlShader: RawShader = {
	title: 'Закрученность',
	fragment,
	inputs: [
		{
			name: 'angle',
			title: 'Угол',
			default: 180,
			input: {
				type: 'angle',
				mode: AngleShaderMode.DEGREE,
				step: 0.5
			}
		},
		{
			name: 'radius',
			title: 'Радиус',
			default: 50,
			input: {
				type: 'float',
				min: 0,
				step: 1
			}
		},
		{
			name: 'center',
			title: 'Центр',
			default: {
				type: 'frame',
				value: { x: 0.5, y: 0.5 }
			},
			input: {
				type: 'point',
				color: '#0aaaa0'
			}
		}
	]
};
