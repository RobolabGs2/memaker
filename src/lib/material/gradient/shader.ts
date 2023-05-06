import fragmentShader from './gradient.frag?raw';

export const Gradient4Shader = {
	fragment: fragmentShader,
	uniforms(settings: unknown) {
		return {
			colors: [
				[1, 0, 0],
				[0, 1, 0],
				[0, 1, 1],
				[0, 0, 1]
			].flat()
		};
	}
};
