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
				mode: AngleShaderMode.RADIAN,
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
			default: { x: 100, y: 100 },
			input: {
				type: 'point',
				color: '#0aaaa0'
			}
		}
	]
};
