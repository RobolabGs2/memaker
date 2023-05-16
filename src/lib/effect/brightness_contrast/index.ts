import type { RawShader } from '$lib/graphics/graphics';
import fragment from './shader.frag?raw';

export interface BrightnessContrastSettings {
	type: 'brightness_contrast';
	brightness: number;
	contrast: number;
}

export const BrightnessContrastShader: RawShader<BrightnessContrastSettings> = {
	fragment,
	uniforms(settings: BrightnessContrastSettings) {
		return {
			brightness: settings.brightness,
			contrast: settings.contrast
		};
	}
};
