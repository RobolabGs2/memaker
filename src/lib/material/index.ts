import type { Point } from '$lib/geometry/point';
import type { RawShader, ShaderSettings } from '$lib/graphics/shader';
import { ColorShader, type ColorSettings } from './color/shader';
import { Gradient4Shader, type Gradient4Settings } from './gradient/shader';
import { PatternShader, type PatternSettings } from './pattern/shader';
import type { PatternsManager } from './pattern/store';

interface MaterialTypes {
	color: ColorSettings;
	pattern: PatternSettings;
	gradient4: Gradient4Settings;
}
export type MaterialSettings = MaterialTypes[keyof MaterialTypes] | ShaderSettings;
export interface Material {
	settings?: MaterialSettings;
	alpha: number;
	shadow?: ShadowSettings;
}
export type ShadowSettings = {
	blur: number;
	color: string;
	offset: Point;
	saturation: number;
};

export function IsOldMaterial<K extends keyof MaterialTypes>(
	name: K,
	material?: MaterialSettings
): material is MaterialTypes[K] {
	return material?.type === name;
}

export function MaterialShaders(
	patternsNames: PatternsManager
): Record<string, RawShader<unknown>> {
	return {
		color: ColorShader,
		pattern: PatternShader(patternsNames),
		gradient4: Gradient4Shader
	} as const;
}
