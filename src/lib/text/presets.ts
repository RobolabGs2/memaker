import type { TextStyle } from './text';
import { writable } from 'svelte/store';
import { deepCopy } from '$lib/state';

export const defaultStyle: TextStyle = {
	case: 'UPPER',
	align: 'center',
	baseline: 'middle',
	lineSpacing: -0.125,
	fontSizeStrategy: 'same-height',
	fill: {
		settings: {
			type: 'color',
			value: '#ffffff'
		},
		alpha: 1
	},
	stroke: {
		settings: {
			type: 'color',
			value: '#000000'
		},
		alpha: 1
	},
	font: {
		bold: false,
		family: 'Impact',
		italic: false,
		smallCaps: false
	},
	strokeWidth: 14,
	experimental: {}
};

export type StylePresetType = Omit<
	TextStyle,
	'align' | 'baseline' | 'lineSpacing' | 'strokeWidth' | 'experimental' | 'fontSizeStrategy'
> & { lineSpacing?: number; strokeWidth?: number };

export function applyStylePreset(preset: StylePresetType, style: TextStyle): TextStyle {
	style.case = preset.case;
	style.fill = deepCopy(preset.fill);
	style.stroke = deepCopy(preset.stroke);
	style.font = deepCopy(preset.font);
	if (preset.lineSpacing !== undefined) style.lineSpacing = preset.lineSpacing;
	if (preset.strokeWidth !== undefined) style.strokeWidth = preset.strokeWidth;
	return style;
}

const StylePresets: Array<StylePresetType & { name: string }> = [
	{
		name: 'КАНОНИЧНЫЙ ИМПАКТ',
		case: 'UPPER',
		fill: {
			settings: {
				type: 'color',
				value: '#ffffff'
			},
			alpha: 1
		},
		stroke: {
			settings: {
				type: 'color',
				value: '#000000'
			},
			alpha: 1
		},
		font: {
			bold: false,
			family: 'Impact',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'постироничный лобстер',
		case: 'lower',
		fill: {
			settings: {
				type: 'color',
				value: '#ffffff'
			},
			alpha: 1,
			shadow: {
				color: '#000000',
				blur: 15,
				offset: { x: 0, y: 0 },
				saturation: 0
			}
		},
		stroke: {
			settings: {
				type: 'disabled'
			},
			alpha: 1
		},
		font: {
			bold: false,
			family: 'Lobster',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'Субтитры',
		case: 'As is',
		fill: {
			settings: {
				type: 'color',
				value: '#ffffff'
			},
			alpha: 1
		},
		stroke: {
			settings: {
				type: 'color',
				value: '#000000'
			},
			alpha: 1,
			shadow: {
				color: '#000000',
				blur: 10,
				offset: { x: 0, y: 5 },
				saturation: 0
			}
		},
		font: {
			bold: true,
			family: 'Arial',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'подпись с тенью',
		case: 'As is',
		fill: {
			settings: {
				type: 'color',
				value: '#ffffff'
			},
			alpha: 1,
			shadow: {
				color: '#000000',
				blur: 40,
				offset: { x: 0, y: 0 },
				saturation: 0
			}
		},
		stroke: {
			settings: { type: 'disabled' },
			alpha: 1
		},
		lineSpacing: -0.15,
		font: {
			bold: true,
			family: 'Helvetica',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'Arial с обводкой',
		case: 'As is',
		fill: {
			settings: {
				type: 'color',
				value: '#ffffff'
			},
			alpha: 1
		},
		stroke: {
			settings: {
				type: 'color',
				value: '#000000'
			},
			alpha: 1
		},
		font: {
			bold: false,
			family: 'Arial',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'Обычный текст',
		case: 'As is',
		fill: {
			settings: {
				type: 'color',
				value: '#000000'
			},
			alpha: 1
		},
		stroke: {
			settings: {
				type: 'disabled'
			},
			alpha: 1
		},
		font: {
			bold: false,
			family: 'Arial',
			italic: false,
			smallCaps: false
		}
	}
];

export const presets = writable(StylePresets);
