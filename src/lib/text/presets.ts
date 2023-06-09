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
>;

export function applyStylePreset(preset: StylePresetType, style: TextStyle): TextStyle {
	style.case = preset.case;
	style.fill = deepCopy(preset.fill);
	style.stroke = deepCopy(preset.stroke);
	style.font = deepCopy(preset.font);
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
				offset: { x: 0, y: 0 }
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
	}
];

export const presets = writable(StylePresets);
