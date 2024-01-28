import {
	AngleShaderMode,
	type UniformInput,
	type UniformInputDefault,
	type UniformInputType
} from './inputs';
import type { Point } from '$lib/geometry/point';
import type { Rectangle } from '$lib/geometry/rectangle';
import type { TextureManager } from './textures';

export function parseColor(color: string): [number, number, number] {
	const raw = parseInt(color.slice(1), 16);
	return [(raw >> (2 * 8)) / 255, ((raw >> 8) & 0xff) / 255, (raw & 0xff) / 255];
}
export function parseColorBytes(color: string): [number, number, number] {
	const raw = parseInt(color.slice(1), 16);
	return [raw >> (2 * 8), (raw >> 8) & 0xff, raw & 0xff];
}

export interface RawShader<T = unknown> {
	title?: string;
	description?: string;
	vertex?: string;
	fragment?: string;
	inputs?: ShaderInputDesc[];
	uniforms?(settings: T, rectangle: Rectangle, ctx: GraphicsContext): Record<string, unknown>;
}

export interface GraphicsContext {
	textures: TextureManager<unknown>;
}

export type ShaderInputDesc<T extends UniformInputType = UniformInputType> = {
	name: string;
	title: string;
	description?: string;
	default: UniformInputDefault<T>;
	input: UniformInput<T>;
};

export function inputToUniform(
	input: ShaderInputDesc,
	src: Record<string, unknown>,
	uniforms: Record<string, unknown>
) {
	const uniformName = input.name;
	let value = src[input.name];
	if (value === undefined) {
		value = src[input.name] = structuredClone(input.default);
	}
	const settings = input.input;
	switch (settings.type) {
		case 'float':
			uniforms[uniformName] = value;
			break;
		case 'int':
			uniforms[uniformName] = (value as number) | 0;
			break;
		case 'color':
			uniforms[uniformName] = parseColor(value as string);
			break;
		case 'angle':
			uniforms[uniformName] =
				settings.mode == AngleShaderMode.DEGREE ? value : ((value as number) / 180) * Math.PI;
			break;
		case 'point': {
			const { x, y } = value as Point;
			uniforms[uniformName] = [x, y];
			break;
		}
	}
}
