import { IdGenerator } from '$lib/id_generator';
import { downloadImage } from '$lib/utils';
import * as twgl from 'twgl.js';

export type TextureOptions<T> = twgl.TextureOptions & { id?: string; meta: T };

export class Texture<T = unknown> {
	constructor(
		readonly id: string,
		readonly original: HTMLImageElement,
		readonly texture: WebGLTexture,
		readonly meta: T
	) {}
	get width() {
		return this.original.width;
	}
	get height() {
		return this.original.height;
	}
}

export class TextureManager<T = unknown> {
	constructor(
		readonly gl: WebGL2RenderingContext,
		readonly idGenerator = new IdGenerator('textures')
	) {}
	private textures = new Map<string, Texture<T>>();

	addImage(image: HTMLImageElement, options: TextureOptions<T>): Texture<T> {
		let id = options?.id;
		if (id && this.textures.has(id)) {
			throw new Error(`Texture with id ${id} already exists`);
		}
		if (!id) {
			for (let i = 0; i < this.textures.size + 5; i++) {
				id = this.idGenerator.generate();
				if (!this.textures.has(id)) break;
				id = undefined;
			}
			if (!id) throw new Error(`Textures overflow!`);
		}
		const textureWebgl = twgl.createTexture(this.gl, { src: image });
		const texture = new Texture(id, image, textureWebgl, options.meta);
		this.textures.set(id, texture);
		return texture;
	}

	downloadImage(url: string, options: TextureOptions<T>): Promise<Texture<T>> {
		return downloadImage(url).then((image) => this.addImage(image, options));
	}

	delete(id: string): Texture<T>['original'] {
		const tex = this.textures.get(id);
		if (!tex) throw new Error(`Texture with id ${id} already deleted`);
		this.gl.deleteTexture(tex.texture);
		this.textures.delete(id);
		return tex.original;
	}

	get(id: string): Texture<T> {
		const tex = this.textures.get(id);
		if (!tex) throw new Error(`Texture with id ${id} not found`);
		return tex;
	}

	has(id: string): boolean {
		return this.textures.has(id);
	}

	clear() {
		this.textures.forEach((texture) => this.gl.deleteTexture(texture.texture));
		this.textures.clear();
	}
}
