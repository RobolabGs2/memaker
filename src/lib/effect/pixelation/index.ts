import type { ShaderInputDesc, RawShader } from '$lib/graphics/shader';
import fragment from './shader.frag?raw';

const inputs: ShaderInputDesc[] = [
	{
		name: 'radius',
		title: 'Радиус',
		description: 'Размер пикселя',
		default: 10,
		input: {
			type: 'float',
			min: 1,
			step: 1
		}
	}
];

export const PixelationShader: RawShader = {
	title: 'Пиксели',
	fragment,
	inputs
};
