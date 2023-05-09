import fragmentShader from './pattern.frag?raw';
import { m4 } from 'twgl.js';
import type { Rectangle } from '$lib/geometry/rectangle';
import type { PatternsManager } from './store';
import type { GraphicsContext } from '$lib/graphics/graphics';
import type { Point } from '$lib/geometry/point';

export interface PatternSettings {
	type: 'pattern';
	name: string;
	scale: 'font' | Point;
	rotate: number;
	shift: Point;
}

export function PatternShader(patterns: PatternsManager) {
	return {
		fragment: fragmentShader,
		uniforms(settings: PatternSettings, block: Rectangle, ctx: GraphicsContext) {
			const pattern = ctx.textures.get(patterns.getTexture(settings.name));
			const scale =
				settings.scale == 'font'
					? m4.identity()
					: m4.scaling([
							block.width / (pattern.width * settings.scale.x),
							block.height / (pattern.height * settings.scale.y),
							1
					  ]);
			return {
				patternSampler: pattern.texture,
				patternTransform: m4.multiply(
					m4.rotateZ(
						m4.translation([
							settings.shift.x / pattern.width,
							settings.shift.y / pattern.height,
							0
						]),
						(settings.rotate / 180) * Math.PI
					),
					scale
				)
			};
		}
	};
}
