import { writable } from 'svelte/store';
import type { Theme } from './ThemeContext.svelte';

export const DarkTheme: Theme = {
	textSecondary: 'white',
	secondary: '#34352F',
	secondaryHover: '#3E3D32',
	secondaryActive: '#272822',
	borderSecondary: '1px solid #111111',
	borderSecondaryHover: '1px solid #222222',
	borderSecondaryActive: '1px solid #aaaaaa',
	border: 'none',
	textError: '#ff0000'
};

export const theme = writable<Theme>(DarkTheme);
