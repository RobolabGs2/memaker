import type { Material } from '$lib/material/material';
import type { FontSettings } from './font';

export type TextCase = 'As is' | 'UPPER' | 'lower';
export type TextAlign = CanvasTextAlign;
export type TextBaseline = CanvasTextBaseline;

export function textToCase(text: string, textCase: TextCase): string {
	switch (textCase) {
		case 'As is':
			return text;
		case 'UPPER':
			return text.toUpperCase();
		case 'lower':
			return text.toLowerCase();
	}
	throw new Error(`Unsupported text case type: ${textCase}`);
}

export interface TextStyle {
	font: FontSettings;
	lineSpacing: number;
	case: TextCase;
	align: TextAlign;
	baseline: TextBaseline;
	fill: Material;
	stroke: Material;
	// [0, 100] % от кегля
	strokeWidth: number;
	experimental: Record<string, never>;
}

export function deepCopyTextStyle(style: TextStyle): TextStyle {
	return JSON.parse(JSON.stringify(style));
}
