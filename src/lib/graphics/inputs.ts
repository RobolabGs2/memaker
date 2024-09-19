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
			layout: NumberLayout;
		};
	};
	int: {
		default: number;
		input: {
			type: 'int';
			min?: number;
			max?: number;
			step?: number;
			layout: NumberLayout;
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
		default: {
			type: 'frame' | 'absolute';
			value: Point;
		};
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
export const UniformInputTypes: ReadonlyArray<UniformInputType> = ["float", "int", "angle", "point", "color"];
export type UniformInputDefault<T extends UniformInputType = UniformInputType> =
	ShaderInputTypesMap[T]['default'];
export type UniformInput<T extends UniformInputType = UniformInputType> =
	ShaderInputTypesMap[T]['input'];

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
