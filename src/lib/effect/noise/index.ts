import type { RawShader } from '$lib/graphics/graphics';
import fragment from './shader.frag?raw';

export interface NoiseSettings {
	type: 'noise';
	radius: number;
	minAlpha: number;
	maxAlpha: number;
}

export const NoiseShader: RawShader<NoiseSettings> = {
	fragment,
	uniforms(settings: NoiseSettings) {
		return {
			radius: settings.radius,
			minAlpha: settings.minAlpha,
			maxAlpha: settings.maxAlpha
		};
	}
};
