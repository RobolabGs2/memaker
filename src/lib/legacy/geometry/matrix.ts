import type Point from './point';

export class Matrix {
	private data = [
		[0, 0, 0],
		[0, 0, 0],
		[0, 0, 0]
	];

	public static Zero(): Matrix {
		return new Matrix();
	}

	public static Ident(): Matrix {
		const result = new Matrix();
		result.data[0][0] = 1;
		result.data[1][1] = 1;
		result.data[2][2] = 1;
		return result;
	}

	public static RotationAround(point: Point, angle: number): Matrix {
		return Matrix.Translate({ x: -point.x, y: -point.y })
			.Multiply(this.Rotation(angle))
			.Multiply(Matrix.Translate(point));
	}

	public static Rotation(angle: number): Matrix {
		const sin = Math.sin(angle);
		const cos = Math.cos(angle);
		return this.RotationCosSin(cos, sin);
	}

	public static RotationCosSin(cos: number, sin: number): Matrix {
		const result = Matrix.Ident();
		result.data[0][0] = cos;
		result.data[0][1] = sin;
		result.data[1][0] = -sin;
		result.data[1][1] = cos;
		return result;
	}

	public static Translate(p: Point): Matrix;
	public static Translate(x: number, y: number): Matrix;
	public static Translate(x: Point | number, y?: number): Matrix {
		const result = Matrix.Ident();
		if (typeof x == 'number' && typeof y == 'number') {
			result.data[2][0] = x as number;
			result.data[2][1] = y;
		} else if (typeof x !== 'number') {
			const p = x;
			result.data[2][0] = p.x;
			result.data[2][1] = p.y;
		} else {
			throw new Error(
				`Unexpected type combination in Matrix.Translate: x: ${typeof x}, y: ${typeof y}`
			);
		}
		return result;
	}

	public Get(i: number, j: number): number {
		return this.data[i][j];
	}

	public Set(i: number, j: number, v: number) {
		this.data[i][j] = v;
	}

	public Multiply(m: Matrix): Matrix {
		const result = Matrix.Zero();
		for (let i = 0; i < 3; ++i)
			for (let j = 0; j < 3; ++j)
				for (let k = 0; k < 3; ++k) result.data[i][j] += this.data[i][k] * m.data[k][j];
		return result;
	}

	public Transform(p: Point, result: Point = { x: 0, y: 0 }): Point {
		const x = this.Get(0, 0) * p.x + this.Get(1, 0) * p.y + this.Get(2, 0);
		const y = this.Get(0, 1) * p.x + this.Get(1, 1) * p.y + this.Get(2, 1);
		const z = this.Get(0, 2) * p.x + this.Get(1, 2) * p.y + this.Get(2, 2);
		result.x = x / z;
		result.y = y / z;
		return result;
	}
}
