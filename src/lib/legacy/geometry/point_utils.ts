import type Point from './point';

export function mid({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point): Point {
	return {
		x: (x1 + x2) / 2,
		y: (y1 + y2) / 2
	};
}
export function dist({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point): number {
	const dx = x1 - x2;
	const dy = y1 - y2;
	return Math.sqrt(dx * dx + dy * dy);
}
export function length({ x, y }: Point) {
	return Math.sqrt(x * x + y * y);
}
export function multiply(n: number, { x, y }: Point): Point {
	return { x: n * x, y: n * y };
}
export function vector(from: Point, to: Point): Point {
	return { x: to.x - from.x, y: to.y - from.y };
}
export function scalar(v1: Point, v2: Point): number {
	return v1.x * v2.x + v1.y * v2.y;
}
export function equals(p1: Point, p2: Point, precision = 0) {
	return Math.abs(p1.x - p2.x) <= precision && Math.abs(p1.y - p2.y) <= precision;
}
