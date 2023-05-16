import type { Point } from '$lib/geometry/point';
import type { RawShader } from '$lib/graphics/graphics';
import fragment from './shader.frag?raw';

export interface SwirlSettings {
	type: 'swirl';
	center: Point;
	radius: number;
	angle: number;
}

export const SwirlShader: RawShader<SwirlSettings> = {
	fragment,
	uniforms(settings: SwirlSettings) {
		return {
			center: [settings.center.x, settings.center.y],
			radius: settings.radius,
			angle: (settings.angle / 180) * Math.PI
		};
	}
};
