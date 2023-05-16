import type { RawShader } from '$lib/graphics/graphics';
import { BrightnessContrastShader, type BrightnessContrastSettings } from './brightness_contrast';
import { BugleShader, type BugleSettings } from './bugle';
import grayscaleShader from './grayscale.frag?raw';
import { NoiseShader, type NoiseSettings } from './noise';
import { PinchShader, type PinchSettings } from './pinch';
import { SwirlShader, type SwirlSettings } from './swirl';
import { TemperatureShader, type TemperatureSettings } from './temperature';

interface EffectTypes {
	noise: NoiseSettings;
	bugle: BugleSettings;
	pinch: PinchSettings;
	swirl: SwirlSettings;
	grayscale: { type: 'grayscale' };
	brightness_contrast: BrightnessContrastSettings;
	temperature: TemperatureSettings;
}
export type EffectType = keyof EffectTypes;
export type EffectSettings<T extends EffectType> = EffectTypes[T];
export interface Effect<T extends EffectType = EffectType> {
	settings: EffectSettings<T>;
}

export function EffectShaders(): Record<EffectType, RawShader<unknown>> {
	return {
		noise: NoiseShader,
		bugle: BugleShader,
		pinch: PinchShader,
		swirl: SwirlShader,
		grayscale: {
			fragment: grayscaleShader,
			uniforms() {
				return {};
			}
		},
		brightness_contrast: BrightnessContrastShader,
		temperature: TemperatureShader
	} as const;
}
