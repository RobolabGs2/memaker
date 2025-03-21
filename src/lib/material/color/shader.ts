import { parseColor, type RawShader } from '$lib/graphics/shader';
import fragmentShader from './color.frag?raw';

export type Color = string;
export interface ColorSettings {
	type: 'color';
	value: Color;
}

export const ColorShader: RawShader<any> = {
	title: "Цвет",
	fragment: fragmentShader,
	uniforms(settings: ColorSettings) {
		return {
			color: parseColor(settings.value)
		};
	}
};
