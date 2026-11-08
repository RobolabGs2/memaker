import { AngleShaderMode, NumberLayout } from '$lib/graphics/inputs';
import type { RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

export const SwirlShader: RawShader = {
	title: 'Закрученность',
	fragment,
	inputs: [
		{
			name: 'angle',
			title: 'Угол',
			input: {
				type: 'angle',
				default: Math.PI,
				step: 0.5
			}
		},
		{
			name: 'radius',
			title: 'Радиус',
			input: {
				type: 'float',
				default: 50,
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
				color: '#0aaaa0'
			}
		}
	]
};
