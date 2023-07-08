import { NumberLayout } from '$lib/graphics/inputs';
import type { ShaderInputDesc, RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

const inputs: ShaderInputDesc[] = [
	{
		name: 'radius',
		title: 'Радиус',
		description: 'Радиус разброса пикселей',
		default: 10,
		input: {
			type: 'float',
			min: 0,
			step: 1
		}
	},
	{
		name: 'minAlpha',
		title: 'Минимальный альфа-канал',
		default: 0.5,
		input: {
			type: 'float',
			min: 0,
			max: 1,
			step: 0.05,
			layout: NumberLayout.RANGE
		}
	},
	{
		name: 'maxAlpha',
		title: 'Максимальный альфа-канал',
		default: 1,
		input: {
			type: 'float',
			min: 0,
			max: 1,
			step: 0.05,
			layout: NumberLayout.RANGE
		}
	}
];

export const NoiseShader: RawShader = {
	title: 'Шум',
	fragment,
	inputs
};
