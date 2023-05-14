import type { Point } from '$lib/geometry/point';
import type { RawShader } from '$lib/graphics/graphics';
import noiseShader from './noise.frag?raw';
import bugleShader from './bugle.frag?raw';
import pinchShader from './pinch.frag?raw';
import swirlShader from './swirl.frag?raw';

interface EffectTypes {
	noise: { type: 'noise'; radius: number; minAlpha: number; maxAlpha: number };
	bugle: { type: 'bugle'; radius: number; strength: number; center: Point };
	pinch: { type: 'pinch'; radius: number; strength: number; center: Point };
	swirl: { type: 'swirl'; radius: number; angle: number; center: Point };
}
export type EffectType = keyof EffectTypes;
export type EffectSettings<T extends EffectType> = EffectTypes[T];
export interface Effect<T extends EffectType = EffectType> {
	settings: EffectSettings<T>;
}

export function EffectShaders(): Record<EffectType, RawShader<unknown>> {
	return {
		noise: {
			fragment: noiseShader,
			uniforms(settings: EffectSettings<'noise'>) {
				return {
					radius: settings.radius,
					minAlpha: settings.minAlpha,
					maxAlpha: settings.maxAlpha
				};
			}
		},
		bugle: {
			fragment: bugleShader,
			uniforms(settings: EffectSettings<'bugle'>) {
				return {
					center: [settings.center.x, settings.center.y],
					radius: settings.radius,
					strength: settings.strength
				};
			}
		},
		pinch: {
			fragment: pinchShader,
			uniforms(settings: EffectSettings<'pinch'>) {
				return {
					center: [settings.center.x, settings.center.y],
					radius: settings.radius,
					strength: settings.strength
				};
			}
		},
		swirl: {
			fragment: swirlShader,
			uniforms(settings: EffectSettings<'swirl'>) {
				return {
					center: [settings.center.x, settings.center.y],
					radius: settings.radius,
					angle: settings.angle
				};
			}
		}
	} as const;
}

export const EffectDefaults: Record<EffectType, EffectSettings<EffectType>> = {
	noise: { type: 'noise', radius: 10, minAlpha: 0.5, maxAlpha: 1 },
	bugle: { type: 'bugle', center: { x: 250, y: 250 }, radius: 500, strength: 0.5 },
	pinch: { type: 'pinch', center: { x: 250, y: 250 }, radius: 500, strength: 0.5 },
	swirl: { type: 'swirl', center: { x: 250, y: 250 }, radius: 500, angle: Math.PI }
};
