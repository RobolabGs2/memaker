export interface FontSettings {
	italic: boolean;
	smallCaps: boolean;
	bold: boolean;
	family: string;
}

export function fontSettingsToCSS({ italic, smallCaps, bold, family }: FontSettings, size: number) {
	const style = italic ? 'italic' : 'normal';
	const variant = smallCaps ? 'small-caps' : 'normal';
	const weight = bold ? 'bold' : 'normal';
	return `${style} ${variant} ${weight} ${size}px ${family}`;
}
