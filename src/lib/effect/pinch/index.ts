import { NumberLayout } from '$lib/graphics/inputs';
import type { RawShader, ShaderInputDesc } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

const inputs: ShaderInputDesc[] = [
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
		default: { x: 100, y: 100 },
		title: 'Центр',
		input: {
			type: 'point',
			color: '#ff00ff'
		}
	}
];

export const PinchShader: RawShader = {
	title: 'Вогнутость',
	fragment,
	inputs
};
