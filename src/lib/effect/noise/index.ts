import { NumberLayout } from '$lib/graphics/inputs';
import type { UniformDesc, RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

const inputs: UniformDesc[] = [
	{
		name: 'radius',
		title: 'Радиус',
		description: 'Радиус разброса пикселей',
		input: {
			type: 'float',
			default: 10,
			min: 0,
			step: 1,
			layout: NumberLayout.NUMBER
		}
	},
	{
		name: 'minAlpha',
		title: 'Минимальный альфа-канал',
		input: {
			type: 'float',
			default: 0.5,
			min: 0,
			max: 1,
			step: 0.05,
			layout: NumberLayout.RANGE
		}
	},
	{
		name: 'maxAlpha',
		title: 'Максимальный альфа-канал',
		input: {
			type: 'float',
			default: 1,
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
