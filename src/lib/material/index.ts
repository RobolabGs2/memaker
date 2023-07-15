import type { Point } from '$lib/geometry/point';
import type { RawShader } from '$lib/graphics/shader';
import { ColorShader, type ColorSettings } from './color/shader';
import { Gradient4Shader, type Gradient4Settings } from './gradient/shader';
import { PatternShader, type PatternSettings } from './pattern/shader';
import type { PatternsManager } from './pattern/store';

interface MaterialTypes {
	disabled: {
		type: 'disabled';
	};
	color: ColorSettings;
	pattern: PatternSettings;
	gradient4: Gradient4Settings;
}
export type MaterialType = keyof MaterialTypes;
export type MaterialSettings<T extends MaterialType> = MaterialTypes[T];
export interface Material<T extends MaterialType = MaterialType> {
	settings: MaterialSettings<T>;
	alpha: number;
	shadow?: ShadowSettings;
}
export type ShadowSettings = {
	blur: number;
	color: string;
	offset: Point;
};

export function MaterialShaders(
	patternsNames: PatternsManager
): Record<Exclude<MaterialType, 'disabled'>, RawShader<unknown>> {
	return {
		color: ColorShader,
		pattern: PatternShader(patternsNames),
		gradient4: Gradient4Shader
	} as const;
}
