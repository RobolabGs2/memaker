import type { Point } from '$lib/geometry/point';

export enum AngleShaderMode {
	RADIAN = 0,
	DEGREE = 1
}

export enum NumberLayout {
	NUMBER = 0,
	RANGE = 1
}

interface ShaderInputTypesMap {
	float: {
		default: number;
		input: {
			type: 'float';
			min?: number;
			max?: number;
			step?: number;
			layout?: NumberLayout;
		};
	};
	int: {
		default: number;
		input: {
			type: 'int';
			min?: number;
			max?: number;
			step?: number;
			layout?: NumberLayout;
		};
	};
	angle: {
		default: number;
		input: {
			type: 'angle';
			mode: AngleShaderMode;
			min?: number;
			max?: number;
			step?: number;
		};
	};
	point: {
		default: Point;
		input: {
			type: 'point';
			color: string;
		};
	};
	color: {
		default: string;
		input: {
			type: 'color';
		};
	};
}

export type UniformInputType = keyof ShaderInputTypesMap;
export type UniformInputDefault<T extends UniformInputType = UniformInputType> =
	ShaderInputTypesMap[T]['default'];
export type UniformInput<T extends UniformInputType = UniformInputType> =
	ShaderInputTypesMap[T]['input'];
