import type { Point } from '$lib/geometry/point';
import type { RawShader } from '$lib/graphics/graphics';
import fragment from './shader.frag?raw';

export interface PinchSettings {
	type: 'pinch';
	center: Point;
	radius: number;
	strength: number;
}

export const PinchShader: RawShader<PinchSettings> = {
	fragment,
	uniforms(settings: PinchSettings) {
		return {
			center: [settings.center.x, settings.center.y],
			radius: settings.radius,
			strength: settings.strength
		};
	}
};
