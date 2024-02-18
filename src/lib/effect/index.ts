import { BrightnessContrastShader } from './brightness_contrast';
import { BugleShader } from './bugle';
import grayscaleShader from './grayscale.frag?raw';
import { NoiseShader } from './noise';
import { PinchShader } from './pinch';
import { SwirlShader } from './swirl';
import { TemperatureShader } from './temperature';
import type { RawShader } from '$lib/graphics/shader';
import { PixelationShader } from './pixelation';

export type EffectSettings = Record<string, unknown>;
export interface Effect {
	type: string;
	settings: EffectSettings;
}

export function EffectShaders(): Record<string, RawShader> {
	return {
		noise: NoiseShader,
		bugle: BugleShader,
		pinch: PinchShader,
		swirl: SwirlShader,
		grayscale: {
			title: 'Оттенки серого',
			fragment: grayscaleShader
		},
		brightness_contrast: BrightnessContrastShader,
		temperature: TemperatureShader,
		pixelation: PixelationShader
	};
}

export interface ShaderResource {
	name: string;
	shader: RawShader;
	source: 'default' | 'user';
}

const defaultShaders: ShaderResource[] = [
	{ name: 'noise', shader: NoiseShader, source: "default" },
	{ name: 'bugle', shader: BugleShader, source: "default" },
	{ name: 'pinch', shader: PinchShader, source: "default" },
	{ name: 'swirl', shader: SwirlShader, source: "default" },
	{ name: 'grayscale', shader: { title: 'Оттенки серого', fragment: grayscaleShader}, source: "default" },
	{ name: 'brightness_contrast', shader: BrightnessContrastShader, source: "default" },
	{ name: 'temperature', shader: TemperatureShader, source: "default" },
	{ name: 'pixelation', shader: PixelationShader, source: "default" }
];

export class ShadersManager {

}
