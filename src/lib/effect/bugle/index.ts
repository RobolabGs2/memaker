import type { Point } from '$lib/geometry/point';
import type { RawShader } from '$lib/graphics/graphics';
import fragment from './shader.frag?raw';

export interface BugleSettings {
	type: 'bugle';
	center: Point;
	radius: number;
	strength: number;
}

export const BugleShader: RawShader<BugleSettings> = {
	fragment,
	uniforms(settings: BugleSettings) {
		return {
			center: [settings.center.x, settings.center.y],
			radius: settings.radius,
			strength: settings.strength
		};
	}
};
