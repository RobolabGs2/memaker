import * as twgl from 'twgl.js';

export class FrameBuffersPool {
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
