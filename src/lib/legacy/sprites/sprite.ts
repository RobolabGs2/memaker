import { Matrix } from '../geometry/matrix';
import type { Point } from '../../geometry/point';
import Polygon from '../geometry/polygon';
import type { SpriteState, Sprite } from './sprite_system';

export interface SpriteSettings {
	fill: Partial<Record<SpriteState, string>>;
	stroke: Partial<Record<SpriteState, string>>;
}

export abstract class DragAndDropSprite implements Sprite {
	constructor(public interactive = false, public settings: SpriteSettings) {}
	protected abstract makePath(ctx: CanvasRenderingContext2D, state: SpriteState): void;
	public abstract contains(point: Point): boolean;
	draw(ctx: CanvasRenderingContext2D, state: SpriteState): void {
		const fill = this.settings.fill[state];
		const stroke = this.settings.stroke[state];
		this.makePath(ctx, state);
		if (fill) {
			ctx.fillStyle = fill;
			ctx.fill();
		}
		if (stroke) {
			ctx.strokeStyle = stroke;
			ctx.stroke();
		}
	}
}

export abstract class DragAndDropDynamicPolygon extends DragAndDropSprite {
	constructor(public transform = new Transform(), interactive = false, settings: SpriteSettings) {
		super(interactive, settings);
	}
	protected abstract localPolygon(): Polygon;
	getPolygon() {
		return this.localPolygon().transformCopy(this.transform.matrix());
	}
	protected makePath(ctx: CanvasRenderingContext2D): void {
		makePath(ctx, this.getPolygon());
	}
	public contains(point: Point): boolean {
		return this.getPolygon().contains(point);
	}
}

export class DragAndDropPolygon extends DragAndDropDynamicPolygon {
	constructor(
		protected polygon: Polygon,
		transform = new Transform(),
		interactive = false,
		settings: SpriteSettings
	) {
		super(transform, interactive, settings);
	}
	protected localPolygon(): Polygon {
		return this.polygon;
	}
}

export class DragAndDropCalculatedPolygon extends DragAndDropDynamicPolygon {
	constructor(
		protected localPolygon: () => Polygon,
		transform = new Transform(),
		interactive = false,
		settings: SpriteSettings
	) {
		super(transform, interactive, settings);
	}
}

export function createRectangle(width: number, height: number) {
	const halfX = width / 2;
	const halfY = height / 2;
	return new Polygon([
		{ x: -halfX, y: -halfY },
		{ x: halfX, y: -halfY },
		{ x: halfX, y: halfY },
		{ x: -halfX, y: halfY }
	]);
}

export class RectangleSprite extends DragAndDropPolygon {
	createPolygon() {
		const halfX = this.width / 2;
		const halfY = this.height / 2;
		const visiblePolygon = new Polygon([
			{ x: -halfX, y: -halfY },
			{ x: halfX, y: -halfY },
			{ x: halfX, y: halfY },
			{ x: -halfX, y: halfY }
		]);
		return visiblePolygon;
	}
	protected makePath(ctx: CanvasRenderingContext2D): void {
		makePath(ctx, this.getPolygon());
	}
	public contains(point: Point): boolean {
		return this.getPolygon().contains(point);
	}
	get x() {
		return this.transform.x;
	}
	get y() {
		return this.transform.y;
	}
	public get left(): number {
		return this.x - this.width / 2;
	}
	public set left(n: number) {
		this.width = Math.abs((this.x - n) * 2);
	}
	public get right(): number {
		return this.x + this.width / 2;
	}
	public set right(n: number) {
		this.width = Math.abs((n - this.x) * 2);
	}
	public get top(): number {
		return this.y - this.height / 2;
	}
	public set top(n: number) {
		this.height = Math.abs((this.y - n) * 2);
	}
	public get bottom(): number {
		return this.y + this.height / 2;
	}
	public set bottom(n: number) {
		this.height = Math.abs((n - this.y) * 2);
	}
	private _width: number;
	private _height: number;
	public get height() {
		return this._height;
	}
	public set height(value: number) {
		this._height = value;
		this.polygon = this.createPolygon();
	}
	public get width() {
		return this._width;
	}
	public set width(value: number) {
		this._width = value;
		this.polygon = this.createPolygon();
	}
	constructor(
		x: number,
		y: number,
		width: number,
		height: number,
		rotate: number,
		settings: SpriteSettings
	) {
		super(createRectangle(width, height), new Transform(x, y, rotate), false, settings);
		this._width = width;
		this._height = height;
	}
}

interface ReadonlyTransform {
	readonly x: number;
	readonly y: number;
	readonly rotate: number;
	readonly parent?: ReadonlyTransform;
	matrix(): Matrix;
	rotation(): number;
}

export class Transform implements ReadonlyTransform {
	constructor(public x = 0, public y = 0, public rotate = 0, public parent?: Transform) {}
	matrix(): Matrix {
		const t = Matrix.Rotation(this.rotate).Multiply(Matrix.Translate(this));
		return this.parent ? t.Multiply(this.parent.matrix()) : t;
	}
	rotation(): number {
		const t = this.rotate;
		return this.parent ? t + this.parent.rotation() : t;
	}
}

export class DynamicTransform implements ReadonlyTransform {
	constructor(
		public xSource = () => 0,
		public ySource = () => 0,
		public rotateSource = () => 0,
		public parent?: Transform
	) {}
	get rotate() {
		return this.rotateSource();
	}
	get x() {
		return this.xSource();
	}
	get y() {
		return this.ySource();
	}
	matrix(): Matrix {
		const t = Matrix.Rotation(this.rotate).Multiply(Matrix.Translate(this));
		return this.parent ? t.Multiply(this.parent.matrix()) : t;
	}
	rotation(): number {
		const t = this.rotate;
		return this.parent ? t + this.parent.rotation() : t;
	}
}

export function arrowPolygon(length: number, width: number): Polygon {
	const lineWidth = width / 3;
	const halfLine = lineWidth / 2;
	const points = [
		{ x: length - halfLine - 2 * lineWidth, y: halfLine },
		{ x: -halfLine, y: halfLine },
		{ x: -halfLine, y: -halfLine },
		{ x: length - halfLine - 2 * lineWidth, y: -halfLine },

		{ x: length - halfLine - 3 * lineWidth, y: -halfLine - lineWidth },
		{ x: length - halfLine, y: 0 },
		{ x: length - halfLine - 3 * lineWidth, y: +halfLine + lineWidth }
	];
	return new Polygon(points);
}

export function circleArrowPolygon(r: number, angle: number, width: number): Polygon {
	const lineWidth = width / 3;
	const halfLine = lineWidth / 2;
	const steps = (angle / (Math.PI / 45)) | 0;
	const step = angle / steps;
	const pointsStart: Point[] = [];
	const pointsFinish: Point[] = [];
	const innerR = r - halfLine;
	const outerR = r + halfLine;
	for (let i = 0; i < steps; i++) {
		const cos = Math.cos(step * i);
		const sin = Math.sin(step * i);
		const x1 = cos * innerR;
		const y1 = sin * innerR;
		pointsStart.push({ x: x1, y: y1 });
		const x2 = cos * outerR;
		const y2 = sin * outerR;
		pointsFinish.push({ x: x2, y: y2 });
	}
	const arrow = [
		{ x: -width, y: +halfLine + lineWidth },
		{ x: width, y: 0 },
		{ x: -width, y: -halfLine - lineWidth }
	];
	const transformArray = Matrix.Rotation(Math.PI / 2)
		.Multiply(Matrix.Translate({ x: r, y: 0 }))
		.Multiply(Matrix.RotationAround({ x: 0, y: 0 }, angle));
	return new Polygon([
		...pointsStart,
		...arrow.map((p) => transformArray.Transform(p, p)),
		...pointsFinish.reverse()
	]);
}
function makePath(ctx: CanvasRenderingContext2D, p: Polygon) {
	ctx.beginPath();
	ctx.moveTo(p.points[0].x, p.points[0].y);
	p.points.forEach((p) => ctx.lineTo(p.x, p.y));
	ctx.closePath();
}
