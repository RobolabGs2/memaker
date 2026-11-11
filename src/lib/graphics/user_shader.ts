import { uniformInputTypeToGLSL, type UniformInputType } from './inputs';
import type { RawShader, UniformDesc } from './shader';
import { type Completion } from '@codemirror/autocomplete';
import { GLSLES3Functions } from './ui/autocomplete';
import type { CompilationError } from './ui/GLSLEditor.svelte';
import { deepCopy } from '$lib/state';

export interface UserShader {
	title: string;
	type: UserShaderType;
	uniforms: UniformDesc[];
	fragment: string;
}

export type UserShaderType = 'material' | 'effect';

export const userShaderSettings = {
	material: {
		header: `#version 300 es
precision highp float;
precision highp int;

uniform sampler2D stencilSampler;
uniform float alpha;
uniform int channel;
uniform int channels;

in vec2 texCoord;
out vec4 FragColor;

float channelAlpha(int currentChannel, int channels, vec4 o);
vec4 material();
void main() {
    vec4 origin = texture(stencilSampler, texCoord);
    float originAlpha = channelAlpha(channel, channels, origin);
    FragColor = material();
    FragColor.a *= originAlpha * alpha;
}`,
		completions: [
			{
				label: 'stencilSampler',
				type: 'constant',
				detail: 'sampler2D: Текстура с шаблоном текста. Красный канал — обводка, зелёный — заливка'
			},
			{
				label: 'texCoord',
				type: 'constant',
				detail: 'vec2: Текстурные координаты на stencilSampler'
			},
			{
				label: 'channel',
				type: 'constant',
				detail: 'int: Битовая маска текущего слоя, 1 — обводка, 2 — заливка'
			},
			{
				label: 'channels',
				type: 'constant',
				detail: 'int: Битовая маска активных слоёв, 1 — обводка, 2 — заливка'
			}
		],
		default: `vec4 material() {
    vec4 color = vec4(1.0, 0, 0, 1.0);
    return color;
}`
	},
	effect: {
		header: `#version 300 es
precision mediump float;
precision mediump int;

uniform sampler2D layer;
uniform vec2 resolution;
in vec2 texCoord;
out vec4 FragColor;
vec4 effect();
void main() {
    FragColor = effect();
}`,
		completions: [
			{
				label: 'layer',
				type: 'constant',
				detail: 'sampler2D: Текстура с текущим слоем'
			},
			{
				label: 'texCoord',
				type: 'constant',
				detail: 'vec2: Текстурные координаты на layer'
			},
			{
				label: 'resolution',
				type: 'constant',
				detail: 'vec2: Разрешение текущего слоя'
			},
		],
		default: `vec4 effect() {
	vec4 color = texture(layer, texCoord);
	return color;
}`
	}
} as const;

export function completions(shader: UserShader): Completion[] {
	return shader.uniforms
		.map((desc) => {
			return {
				label: desc.name,
				type: 'variable',
				detail: `${typeHint(desc.input.type)}: ${desc.title}`,
				info: desc.description
			} as Completion;
		})
		.concat(userShaderSettings[shader.type].completions)
		.concat(GLSLES3Functions);
}

function typeHint(type: UniformInputType) {
	const glsl = uniformInputTypeToGLSL(type);
	return glsl === type ? glsl : `${glsl} (${type})`;
}

function shaderHeader(shader: UserShader) {
	return (
		userShaderSettings[shader.type].header +
		shader.uniforms
			.map((u) => `uniform ${uniformInputTypeToGLSL(u.input.type)} ${u.name};`)
			.join('')
	);
}

export function parseErrors(shader: UserShader, err: string | undefined): CompilationError[] {
	if (!err) return [];
	const added = new Set();
	const header = shaderHeader(shader).split('\n');
	return err
		.matchAll(/ERROR: \d+:(\d+): (.+)/g)
		.map((match) => {
			const [_full, line, message] = match;
			return { line: Math.max(1, +line - header.length), message } as CompilationError;
		})
		.filter((err) => {
			const key = err.line + err.message;
			if (added.has(key)) return false;
			added.add(key);
			return true;
		})
		.toArray();
}

export function preprocessUserShader(shader: UserShader): RawShader {
	return {
		fragment: shaderHeader(shader) + '\n' + shader.fragment,
		inputs: deepCopy(shader.uniforms),
		title: shader.title
	};
}
