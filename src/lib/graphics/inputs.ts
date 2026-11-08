import type { Point } from '$lib/geometry/point';

export enum NumberLayout {
	NUMBER = 0,
	RANGE = 1
}

interface ShaderInputTypesMap {
	float: {
		input: {
			type: 'float';
			default: number;
			min?: number;
			max?: number;
			step?: number;
			layout: NumberLayout;
		};
	};
	int: {
		input: {
			type: 'int';
			default: number;
			min?: number;
			max?: number;
			step?: number;
			layout: NumberLayout;
		};
	};
	angle: {
		input: {
			type: 'angle';
			default: number;
			min?: number;
			max?: number;
			step?: number;
		};
	};
	point: {
		input: {
			type: 'point';
			default: {
				type: 'frame' | 'absolute';
				value: Point;
			};
			color: string;
		};
	};
	color: {
		input: {
			type: 'color';
			default: string;
		};
	};
}

export type UniformInputType = keyof ShaderInputTypesMap;
export const UniformInputTypes: ReadonlyArray<UniformInputType> = [
	'float',
	'int',
	'angle',
	'point',
	'color'
];
export type UniformInputDefault<T extends UniformInputType = UniformInputType> =
	ShaderInputTypesMap[T]['input']['default'];
export type UniformInput<T extends UniformInputType = UniformInputType> =
	ShaderInputTypesMap[T]['input'];

export function uniformInputTypeToGLSL(t: UniformInputType): string {
	switch (t) {
		case 'float':
			return 'float';
		case 'int':
			return 'int';
		case 'angle':
			return 'float';
		case 'point':
			return 'vec2';
		case 'color':
			return 'vec3';
	}
}

export function getDefaultValue<T extends UniformInputType>(
	type: T,
	defaultSettings: UniformInputDefault<T>,
	context: { frame: { width: number; height: number } }
) {
	if (type === 'point') {
		const settings = defaultSettings as UniformInputDefault<'point'>;
		const { x, y } = settings.value;
		switch (settings.type) {
			case 'absolute':
				return { x, y };
			case 'frame':
				return { x: Math.round(context.frame.width * x), y: Math.round(context.frame.height * y) };
			default:
				throw new Error(`Unexpected type of default point for uniform input: ${settings.type}`);
		}
	}
	return structuredClone(defaultSettings);
}
