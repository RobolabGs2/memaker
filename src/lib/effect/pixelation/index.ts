import { NumberLayout } from '$lib/graphics/inputs';
import type { UniformDesc, RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

const inputs: UniformDesc[] = [
	{
		name: 'radius',
		title: 'Радиус',
		description: 'Размер пикселя',
		input: {
			type: 'float',
			default: 10,
			min: 1,
			step: 1,
			layout: NumberLayout.NUMBER
		}
	}
];

export const PixelationShader: RawShader = {
	title: 'Пиксели',
	fragment,
	inputs
};
