import type { Rectangle } from '$lib/geometry/rectangle';

export interface ImageContent {
	id: string;
	name: string;
	crop: Rectangle;
}
