import type { Rectangle } from '$lib/geometry/rectangle';
import type { Material, ShadowSettings } from '$lib/material';
import * as twgl from 'twgl.js';

import fullscreenShader from './fullscreen.vert?raw';
import shadowFragShader from './gaussian_blur_1d.frag?raw';
import textureFragShader from './texture.frag?raw';
import libGlsl from './lib.glsl?raw';
import baseVertShader from './base.vert?raw';
import baseFragShader from './base.frag?raw';
import blendFragShader from './blend.frag?raw';
import type { TextureManager } from './textures';
import type { Effect } from '$lib/effect';
import { type RawShader, type GraphicsContext, parseColor, inputToUniform } from './shader';
import type { Point } from '$lib/geometry/point';

class FrameBuffersPull {
	constructor(
		readonly gl: WebGL2RenderingContext,
		readonly options: twgl.AttachmentOptions[] = [{ format: gl.RGBA }]
	) {}

	private freeBuffers: twgl.FramebufferInfo[] = [];
	private usedBuffers = new Set<twgl.FramebufferInfo>();
	get(width: number, height: number): twgl.FramebufferInfo {
		const buf = this.freeBuffers.pop();
		if (buf) {
			if (buf.height !== height || buf.width !== width)
				twgl.resizeFramebufferInfo(this.gl, buf, this.options, width, height);
			this.usedBuffers.add(buf);
			this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, buf.framebuffer);
			this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			return buf;
		}
		const newBuf = twgl.createFramebufferInfo(this.gl, this.options, width, height);
		this.gl.clear(this.gl.COLOR_BUFFER_BIT);
		this.usedBuffers.add(newBuf);
		console.log(`Создан новый буфер, всего: ${this.usedBuffers.size}`);
		return newBuf;
	}
	free(buf: twgl.FramebufferInfo) {
		if (!this.usedBuffers.delete(buf)) {
			console.trace('FrameBuffersPull: free not used buffer!');
			return;
		}
		this.freeBuffers.push(buf);
	}
	clear() {
		this.freeBuffers.forEach((buf) => {
			this.gl.deleteFramebuffer(buf.framebuffer);
			buf.attachments.forEach((tx) => {
				if (this.gl.isTexture(tx)) this.gl.deleteTexture(tx);
				else this.gl.deleteRenderbuffer(tx);
			});
		});
		this.freeBuffers = [];
		if (this.usedBuffers.size)
			console.trace(`FrameBuffersPull: call clear with ${this.usedBuffers.size} buffers in use!`);
	}
}

export interface TargetFrameBuffer {
	readonly width: number;
	readonly height: number;
	// null => canvas
	readonly framebuffer: WebGLFramebuffer | null;
}

function materialShaderSources({ vertex, fragment }: RawShader): [string, string] {
	return [vertex || baseVertShader, (fragment || baseFragShader) + libGlsl];
}

function effectShaderSources({ vertex, fragment }: RawShader): [string, string] {
	return [vertex || fullscreenShader, (fragment || baseFragShader) + libGlsl];
}

export class Graphics<T = unknown> {
	constructor(
		private readonly gl: WebGL2RenderingContext,
		public readonly textures: TextureManager<T>,
		materials: Record<string, RawShader<unknown>>,
		mods: Record<string, RawShader<unknown>>
	) {
		gl.clearColor(0, 0, 0, 0);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ONE, gl.ONE_MINUS_DST_ALPHA);
		const shaderSources = Object.entries(materials)
			.map(([name, raw]) => [name, materialShaderSources(raw)])
			.concat(
				Object.entries(mods).map(([name, raw]) => [name, effectShaderSources(raw)]),
				[
					['__shadow__', [fullscreenShader, shadowFragShader + libGlsl]],
					['__image__', [baseVertShader, textureFragShader + libGlsl]],
					['__blend__', [fullscreenShader, blendFragShader]]
				]
			);
		const shaderInfos = twgl.createProgramInfos(gl, Object.fromEntries(shaderSources));
		this.shaders = Object.fromEntries(
			Object.entries({ ...materials, ...mods }).map(([name, raw]) => [
				name,
				{
					uniforms: (s, b, ctx) => {
						if (raw.uniforms) return raw.uniforms(s, b, ctx);
						if (raw.inputs) {
							const uniforms = {} as Record<string, unknown>;
							for (const input of raw.inputs) {
								inputToUniform(input, s, uniforms);
							}
							return uniforms;
						}
						return {};
					},
					info: shaderInfos[name]
				}
			])
		);
		this.shadowProgram = shaderInfos['__shadow__'];
		this.imageProgram = shaderInfos['__image__'];
		this.blendProgram = shaderInfos['__blend__'];
		this.rectangleBuffer = twgl.createBufferInfoFromArrays(gl, {
			position: [
				[-0.5, -0.5, 0],
				[+0.5, -0.5, 0],
				[+0.5, +0.5, 0],
				[+0.5, +0.5, 0],
				[-0.5, +0.5, 0],
				[-0.5, -0.5, 0]
			].flat(),
			textureCoordinate: [
				[0, 0],
				[1, 0],
				[1, 1],
				[1, 1],
				[0, 1],
				[0, 0]
			].flat()
		});
		this.buffersPull = new FrameBuffersPull(this.gl);
	}
	private shaders: Record<
		string,
		{
			info: twgl.ProgramInfo;
			uniforms: (
				settings: Record<string, unknown>,
				rectangle: Rectangle,
				ctx: GraphicsContext
			) => Record<string, unknown>;
		}
	>;
	public buffersPull: FrameBuffersPull;
	private shadowProgram: twgl.ProgramInfo;
	private blendProgram: twgl.ProgramInfo;
	private imageProgram: twgl.ProgramInfo;
	private rectangleBuffer: twgl.BufferInfo;
	public get canvasRenderBuffer(): TargetFrameBuffer {
		return this._canvasRenderBuffer;
	}
	private _canvasRenderBuffer = {
		framebuffer: null,
		width: 0,
		height: 0
	};
	public get size() {
		return { width: this.gl.canvas.width, height: this.gl.canvas.height };
	}
	clear() {
		this.buffersPull.clear();
	}
	resize(width: number, height: number) {
		if (this.canvasRenderBuffer.width == width && this.canvasRenderBuffer.height == height) return;
		this.gl.canvas.width = this._canvasRenderBuffer.width = width;
		this.gl.canvas.height = this._canvasRenderBuffer.height = height;
		this.gl.viewport(0, 0, width, height);
	}
	drawImage(image: WebGLTexture) {
		this.gl.useProgram(this.imageProgram.program);
		this.imageProgram.uniformSetters['textureSampler'](image);
		this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
	}
	drawShadow(
		textStencil: WebGLTexture,
		channel: number,
		channels: number,
		rectangle: Rectangle,
		material: Material,
		shadow: ShadowSettings,
		destination: TargetFrameBuffer
	) {
		const gl = this.gl;
		const shadowBufferOrigin = this.buffersPull.get(destination.width, destination.height);
		this.drawStencilLayer(
			textStencil,
			channel,
			channels,
			{
				...rectangle,
				position: {
					x: rectangle.position.x + shadow.offset.x,
					y: rectangle.position.y + shadow.offset.y
				}
			},
			material,
			shadowBufferOrigin
		);

		const uniforms = {
			color: parseColor(shadow.color),
			alpha: shadow.saturation,
			resolution: [this.size.width, this.size.height],
			blur: Math.min(shadow.blur, 3600)
		};
		gl.useProgram(this.shadowProgram.program);
		// Размытие в два прохода за счёт свойства разделяемости фильтра Гаусса.
		const shadowBufferX = this.buffersPull.get(destination.width, destination.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, shadowBufferX.framebuffer);
		gl.clear(gl.COLOR_BUFFER_BIT);
		twgl.setUniforms(this.shadowProgram, {
			...uniforms,
			sourceSampler: shadowBufferOrigin.attachments[0],
			dim: 0
		});
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
		twgl.setUniforms(this.shadowProgram, {
			...uniforms,
			sourceSampler: shadowBufferX.attachments[0],
			dim: 1
		});
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		this.buffersPull.free(shadowBufferOrigin);
		this.buffersPull.free(shadowBufferX);
	}

	drawStencilLayer(
		textStencil: WebGLTexture,
		channel: number,
		channels: number,
		rectangle: Rectangle,
		material: Material,
		destination: TargetFrameBuffer
	) {
		const gl = this.gl;
		const shader = this.shaders[material.settings.type];
		const uniforms = {
			camera: twgl.m4.ortho(0, this.size.width, this.size.height, 0, -100, 100),
			transform: twgl.m4.scale(
				twgl.m4.rotateZ(
					twgl.m4.translation([rectangle.position.x, rectangle.position.y, 0]),
					rectangle.rotation
				),
				[rectangle.width, rectangle.height, 1]
			),
			stencilSampler: textStencil,
			channel,
			channels,
			alpha: material.alpha,
			...shader.uniforms(material.settings as unknown as Record<string, unknown>, rectangle, this)
		};
		gl.bindFramebuffer(gl.FRAMEBUFFER, destination.framebuffer);
		gl.useProgram(shader.info.program);
		twgl.setUniforms(shader.info, uniforms);
		twgl.setBuffersAndAttributes(gl, shader.info, this.rectangleBuffer);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
	drawModifications(
		modifications: Effect[],
		rectangle: Rectangle,
		source: twgl.FramebufferInfo,
		destination: TargetFrameBuffer,
		reuseSourceBuffer: boolean
	) {
		const gl = this.gl;
		const temp1 = this.buffersPull.get(destination.width, destination.height);
		const temp2 = reuseSourceBuffer
			? source
			: this.buffersPull.get(destination.width, destination.height);
		let src = source;
		let tmp = temp1;
		for (let i = 0; i < modifications.length; i++) {
			const dest = i === modifications.length - 1 ? destination : tmp;

			const mod = modifications[i];
			const shader = this.shaders[mod.type];
			const uniforms = {
				layer: src.attachments[0],
				resolution: [this.size.width, this.size.height],
				...shader.uniforms(mod.settings, rectangle, this)
			};

			gl.bindFramebuffer(gl.FRAMEBUFFER, dest.framebuffer);

			gl.useProgram(shader.info.program);
			twgl.setUniforms(shader.info, uniforms);
			twgl.setBuffersAndAttributes(gl, shader.info, this.rectangleBuffer);
			gl.drawArrays(gl.TRIANGLES, 0, 6);

			if (dest !== destination) {
				tmp = src;
				src = dest as twgl.FramebufferInfo;
			}
		}
		this.buffersPull.free(temp1);
		if (!reuseSourceBuffer) this.buffersPull.free(temp2);
	}

	drawRectImage(
		image: WebGLTexture,
		rectangle: Rectangle,
		texCoords: Point[],
		dest: TargetFrameBuffer
	) {
		const gl = this.gl;
		const shader = this.imageProgram;

		const uniforms = {
			camera: twgl.m4.ortho(0, this.size.width, this.size.height, 0, -100, 100),
			transform: twgl.m4.scale(
				twgl.m4.rotateZ(
					twgl.m4.translation([rectangle.position.x, rectangle.position.y, 0]),
					rectangle.rotation
				),
				[rectangle.width, rectangle.height, 1]
			),
			textureSampler: image
		};
		gl.bindFramebuffer(gl.FRAMEBUFFER, dest.framebuffer);
		gl.useProgram(shader.program);
		twgl.setUniforms(shader, uniforms);
		const buffer = twgl.createBufferInfoFromArrays(
			gl,
			{
				textureCoordinate: pointsToTriangles(texCoords)
			},
			this.rectangleBuffer
		);
		twgl.setBuffersAndAttributes(gl, shader, buffer);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	blendTo(
		blendMode: BlendMode,
		composeMode: ComposeMode,
		src: twgl.FramebufferInfo,
		srcAlpha: number,
		dst: WebGLTexture,
		result: TargetFrameBuffer
	) {
		const gl = this.gl;
		const shader = this.blendProgram;
		const uniforms = {
			srcSampler: src.attachments[0],
			blendMode: BlendModeEnum[blendMode],
			composeMode: ComposeModeEnum[composeMode],
			dstSampler: dst,
			srcAlpha
		} as Record<string, unknown>;
		gl.bindFramebuffer(gl.FRAMEBUFFER, result.framebuffer);
		gl.useProgram(shader.program);
		twgl.setUniforms(shader, uniforms);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}
export type BlendMode = keyof typeof BlendModeEnum;
export type ComposeMode = keyof typeof ComposeModeEnum;

const BlendModeEnum = {
	normal: 0,
	multiply: 1,
	screen: 2,
	overlay: 3,
	darken: 4,
	lighten: 5,
	color_dodge: 6,
	color_burn: 7,
	hard_light: 8,
	soft_light: 9,
	difference: 10,
	exclusion: 11,
	hue: 12,
	saturation: 13,
	color: 14,
	luminosity: 15,
	xor: 17
};

const ComposeModeEnum = {
	clear: 0,
	copy: 1,
	destination: 2,
	source_over: 3,
	destination_over: 4,
	source_in: 5,
	destination_in: 6,
	source_out: 7,
	destination_out: 8,
	source_atop: 9,
	destination_atop: 10,
	xor: 11,
	lighter: 12
};

function pointsToTriangles(p: Point[]): number[] {
	return [
		p[0].x,
		p[0].y,
		p[1].x,
		p[1].y,
		p[2].x,
		p[2].y,
		p[2].x,
		p[2].y,
		p[3].x,
		p[3].y,
		p[0].x,
		p[0].y
	];
}
