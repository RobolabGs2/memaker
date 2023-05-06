import type { Rectangle } from '$lib/geometry/rectangle';
import type { Material, ShadowSettings } from '$lib/material';
import * as twgl from 'twgl.js';

import fullscreenShader from './fullscreen.vert?raw';
import shadowFragShader from './gaussian_blur_1d.frag?raw';
import textureFragShader from './texture.frag?raw';
import libGlsl from './lib.glsl?raw';
import baseVertShader from './base.vert?raw';
import baseFragShader from './base.frag?raw';
import type { TextureManager } from './textures';

export function parseColor(color: string) {
	const raw = parseInt(color.slice(1), 16);
	return [(raw >> (2 * 8)) / 255, ((raw >> 8) & 0xff) / 255, (raw & 0xff) / 255];
}

export interface RawShader<T> {
	vertex?: string;
	fragment?: string;
	uniforms(settings: T, rectangle: Rectangle, ctx: GraphicsContext): Record<string, unknown>;
}

export interface GraphicsContext {
	textures: TextureManager<unknown>;
}

export class Graphics<T = unknown> {
	constructor(
		private readonly gl: WebGL2RenderingContext,
		public readonly textures: TextureManager<T>,
		shaders: Record<string, RawShader<unknown>>
	) {
		gl.enable(gl.BLEND);
		gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
		{
			const options = [{ format: gl.RGBA }];
			this.shadowBuffer = [
				{
					options,
					info: twgl.createFramebufferInfo(gl, options, gl.canvas.width, gl.canvas.height)
				},
				{
					options,
					info: twgl.createFramebufferInfo(gl, options, gl.canvas.width, gl.canvas.height)
				}
			];
		}
		const shaderEntries = Object.entries(shaders);
		const shaderInfos = twgl.createProgramInfos(
			gl,
			Object.fromEntries(
				shaderEntries
					.map(([name, { vertex, fragment }]) => [
						name,
						[vertex || baseVertShader, (fragment || baseFragShader) + libGlsl]
					])
					.concat([
						['__shadow__', [fullscreenShader, shadowFragShader + libGlsl]],
						['__image__', [baseVertShader, textureFragShader + libGlsl]]
					])
			)
		);
		this.shaders = Object.fromEntries(
			shaderEntries.map(([name, raw]) => [
				name,
				{ uniforms: (s, b, ctx) => raw.uniforms(s, b, ctx), info: shaderInfos[name] }
			])
		);
		this.shadowProgram = shaderInfos['__shadow__'];
		this.imageProgram = shaderInfos['__image__'];
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
	}
	private shaders: Record<
		string,
		{ info: twgl.ProgramInfo; uniforms: RawShader<unknown>['uniforms'] }
	>;
	private shadowBuffer: {
		options: twgl.AttachmentOptions[];
		info: twgl.FramebufferInfo;
	}[];
	private shadowProgram: twgl.ProgramInfo;
	private imageProgram: twgl.ProgramInfo;
	private rectangleBuffer: twgl.BufferInfo;
	public get size() {
		return { width: this.gl.canvas.width, height: this.gl.canvas.height };
	}
	resize(width: number, height: number) {
		if (this.size.width == width && this.size.height == height) return;
		this.gl.canvas.width = width;
		this.gl.canvas.height = height;
		this.shadowBuffer.forEach((buffer) => {
			twgl.resizeFramebufferInfo(this.gl, buffer.info, buffer.options, width, height);
		});

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
		shadow: ShadowSettings
	) {
		const gl = this.gl;
		const shadowBufferOrigin = this.shadowBuffer[0].info;
		gl.bindFramebuffer(gl.FRAMEBUFFER, shadowBufferOrigin.framebuffer);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
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
			false
		);

		const uniforms = {
			color: parseColor(shadow.color),
			alpha: 1,
			resolution: [this.size.width, this.size.height],
			blur: Math.min(shadow.blur, 3600)
		};
		gl.useProgram(this.shadowProgram.program);
		// Размытие в два прохода за счёт свойства разделяемости фильтра Гаусса.
		const shadowBufferX = this.shadowBuffer[1].info;
		gl.bindFramebuffer(gl.FRAMEBUFFER, shadowBufferX.framebuffer);
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		twgl.setUniforms(this.shadowProgram, {
			...uniforms,
			stencilSampler: shadowBufferOrigin.attachments[0],
			dim: 0
		});
		gl.drawArrays(gl.TRIANGLES, 0, 6);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		twgl.setUniforms(this.shadowProgram, {
			...uniforms,
			stencilSampler: shadowBufferX.attachments[0],
			dim: 1
		});
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	drawStencilLayer(
		textStencil: WebGLTexture,
		channel: number,
		channels: number,
		rectangle: Rectangle,
		material: Material,
		drawShadow = true
	) {
		const gl = this.gl;
		if (material.settings.type == 'disabled') return;
		if (drawShadow && material.shadow) {
			this.drawShadow(textStencil, channel, channels, rectangle, material, material.shadow);
		}
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
			...shader.uniforms(material.settings as never, rectangle, this)
		};
		gl.useProgram(shader.info.program);
		twgl.setUniforms(shader.info, uniforms);
		twgl.setBuffersAndAttributes(gl, shader.info, this.rectangleBuffer);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	drawRectImage(image: WebGLTexture, rectangle: Rectangle) {
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
		gl.useProgram(shader.program);
		twgl.setUniforms(shader, uniforms);
		twgl.setBuffersAndAttributes(gl, shader, this.rectangleBuffer);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}
}
