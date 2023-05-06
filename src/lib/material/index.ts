import type { Point } from '$lib/geometry/point';

export type Color = string;
interface MaterialTypes {
	disabled: {
		type: 'disabled';
	};
	color: {
		type: 'color';
		value: Color;
	};
	pattern: {
		type: 'pattern';
		name: string;
		scale: 'font' | Point;
		rotate: number;
		shift: Point;
	};
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
