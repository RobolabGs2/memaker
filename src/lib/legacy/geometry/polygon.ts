import type Point from './point';
import Line from './line';
import type { Matrix } from './matrix';

class Edge {
	line: Line;
	constructor(readonly p1: Point, readonly p2: Point) {
		this.line = Line.byTwoPoints(p1, p2);
	}
	get left(): number {
		return Math.min(this.p1.x, this.p2.x);
	}
	get right(): number {
		return Math.max(this.p1.x, this.p2.x);
	}
}

export default class Polygon {
	edges: Edge[];
	constructor(readonly points: Point[]) {
		this.edges = new Array(points.length);
		this.updateEdges();
	}
	private updateEdges() {
		const points = this.points;
		for (let i = 0; i < points.length - 1; i++) this.edges[i] = new Edge(points[i], points[i + 1]);
		this.edges[points.length - 1] = new Edge(points[points.length - 1], points[0]);
	}
	public transform(m: Matrix) {
		const points = this.points;
		const count = points.length;
		for (let i = 0; i < count; i++) m.Transform(points[i], points[i]);
		this.updateEdges();
	}
	public transformCopy(m: Matrix) {
		return new Polygon(this.points.map((p) => m.Transform(p)));
	}
	public contains(p: Point): boolean {
		let sum = 0;
		const count = this.edges.length;
		for (let i = 0; i < count; i++) {
			const edge = this.edges[i];
			if (p.x <= edge.left || p.x > edge.right) continue;
			sum += edge.line.sign(p);
		}
		return sum != 0;
	}
	public center(): Point {
		const points = this.points;
		const count = points.length;
		let x = 0;
		let y = 0;
		for (let i = 0; i < count; i++) {
			x += points[i].x;
			y += points[i].y;
		}
		return { x: x / count, y: y / count };
	}
	public area(): number {
		let area = 0;
		const count = this.points.length - 1;
		const points = this.points;
		for (let i = 0; i < count; i++)
			area += points[i].x * points[i + 1].x - points[i + 1].y * points[i].y;
		area += points[count].x * points[0].y - points[0].x * points[count].y;
		return area / 2;
	}
	public repair(): void {
		if (this.area() < 0) this.points.reverse();
	}
}
