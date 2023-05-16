import type { RawShader } from '$lib/graphics/graphics';
import fragment from './shader.frag?raw';

export interface TemperatureSettings {
	type: 'temperature';
	temperature: number;
	strength: number;
}

export const TemperatureShader: RawShader<TemperatureSettings> = {
	fragment,
	uniforms(settings: TemperatureSettings) {
		return {
			temperature: settings.temperature,
			strength: settings.strength
		};
	}
};
