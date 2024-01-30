import type { TextStyle } from './text';
import { writable } from 'svelte/store';
import { deepCopy } from '$lib/state';

export const defaultStyle: TextStyle = {
	case: 'UPPER',
	align: 'center',
	baseline: 'middle',
	lineSpacing: -0.125,
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
	'align' | 'baseline' | 'lineSpacing' | 'strokeWidth' | 'experimental'
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
		name: 'TRUE IMPACT',
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
		name: 'post-ironic lobster',
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
		name: 'Helvetica bold subtitles',
		case: 'As is',
		fill: {
			alpha: 1,
			settings: { type: 'color', value: '#ffffff' }
		},
		stroke: {
			alpha: 1,
			settings: { type: 'color', value: '#000000' }
		},
		lineSpacing: -0.15,
		strokeWidth: 16.85,
		font: {
			bold: true,
			family: 'Helvetica',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'Arial subtitles',
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
		name: 'Arial bold subtitles',
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
			bold: true,
			family: 'Arial',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'Black Arial',
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
	},
	{
		name: 'Black Arial bold',
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
			bold: true,
			family: 'Arial',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'Black Helvetica bold',
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
		lineSpacing: -0.15,
		strokeWidth: 16.85,
		font: {
			bold: true,
			family: 'Helvetica',
			italic: false,
			smallCaps: false
		}
	},
	{
		name: 'White Helvetica bold',
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
	}
];

export const presets = writable(StylePresets);
