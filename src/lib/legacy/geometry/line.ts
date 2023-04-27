import type Point from './point';

export default class Line {
	public readonly normal: Point;
	public readonly normalization: number;
	constructor(public readonly a: number, public readonly b: number, public readonly c: number) {
		const norm = Math.sqrt(a * a + b * b);
		this.normal = { x: a / norm, y: b / norm };
		this.normalization = norm;
	}

	public static byTwoPoints({ x: x1, y: y1 }: Point, { x: x2, y: y2 }: Point): Line {
		return new Line(y1 - y2, x2 - x1, x1 * y2 - x2 * y1);
	}

	public onLine(p: Point): boolean {
		return Math.abs(this.rawDistance(p)) < 1e-15;
	}

	public sign(p: Point): -1 | 0 | 1 {
		return Math.sign(this.rawDistance(p)) as -1 | 0 | 1;
	}

	public rawDistance({ x, y }: Point): number {
		return this.a * x + this.b * y + this.c;
	}

	public distance(p: Point): number {
		const d = this.rawDistance(p);
		return Math.abs(d) / this.normalization;
	}

	public projection(p: Point): Point {
		const d = this.rawDistance(p) / this.normalization;
		return {
			x: p.x - this.normal.x * d,
			y: p.y - this.normal.y * d
		};
	}
}
