import Line from './line';
import * as PointUtils from './point_utils';
import { describe, it, expect } from 'vitest';

describe('Line by two points', () => {
	const p1 = { x: 3, y: 2 };
	const p2 = { x: -4, y: 3 };
	const another = { x: -4, y: 3.5 };
	const line = Line.byTwoPoints(p1, p2);
	it('should include base and middle points', () => {
		expect(line.onLine(p1)).toBeTruthy();
		expect(line.onLine(p2)).toBeTruthy();
		expect(line.onLine(PointUtils.mid(p1, p2))).toBeTruthy();
	});
	it('should not include another', () => {
		expect(line.onLine(another)).toBeFalsy();
	});
});

describe('Line.sign (0;2) -> (3;2)', () => {
	//    0    1    2    3
	// 0  ┼─────────────────
	//    │
	// 1  │         - (2, 1)
	//    │
	// 2  ┼─────────────>○ (3, 2)
	//    │
	// 3  │    + (1, 3)
	const p1 = { x: 0, y: 2 };
	const p2 = { x: 3, y: 2 };
	const lineLeftToRight = Line.byTwoPoints(p1, p2);
	const lineRightToLeft = Line.byTwoPoints(p2, p1);
	it('should return +1 if point right', () => {
		expect(lineLeftToRight.sign({ x: 1, y: 3 })).toBe(+1);
		expect(lineRightToLeft.sign({ x: 2, y: 1.5 })).toBe(+1);
	});
	it('should return 0 if point on line', () => {
		expect(lineLeftToRight.sign({ x: 3, y: 2 })).toBe(0);
		expect(lineRightToLeft.sign({ x: 3, y: 2 })).toBe(0);
	});

	it('should return -1 if point left', () => {
		expect(lineLeftToRight.sign({ x: 2, y: 1.5 })).toBe(-1);
		expect(lineRightToLeft.sign({ x: 1, y: 3 })).toBe(-1);
	});
});

describe('Line.distanse', () => {
	//    0    1    2    3
	// 0  ┼─────────────────
	//    │
	// 1  │         ○ (2, 1)
	//    │
	// 2  ┼─────────────>○ (3, 2)
	//    │
	// 3  │    ○ (1, 3)
	const p1 = { x: 0, y: 2 };
	const p2 = { x: 3, y: 2 };
	const lineLeftToRight = Line.byTwoPoints(p1, p2);
	const lineRightToLeft = Line.byTwoPoints(p2, p1);
	it('should return correct distance independet from direction', () => {
		expect(lineLeftToRight.distance({ x: 2, y: 1 })).toBeCloseTo(+1);
		expect(lineRightToLeft.distance({ x: 2, y: 1 })).toBeCloseTo(+1);
		expect(lineLeftToRight.distance({ x: 1, y: 4 })).toBeCloseTo(+2);
		expect(lineRightToLeft.distance({ x: 1, y: 4 })).toBeCloseTo(+2);
	});

	describe('Line.projection', () => {
		//    0    1    2    3
		// 0  ┼─────────────────
		//    │
		// 1  │         ○ (2, 1)
		//    │
		// 2  ┼─────────────>○ (3, 2)
		//    │
		// 3  │    ○ (1, 3)
		const p1 = { x: 0, y: 2 };
		const p2 = { x: 3, y: 2 };
		const lineLeftToRight = Line.byTwoPoints(p1, p2);
		const lineRightToLeft = Line.byTwoPoints(p2, p1);
		it('should return correct projection independet from direction', () => {
			expect(lineLeftToRight.projection({ x: 2, y: 1 })).toEqual({ x: 2, y: 2 });
			expect(lineRightToLeft.projection({ x: 2, y: 1 })).toEqual({ x: 2, y: 2 });
			expect(lineLeftToRight.projection({ x: 1, y: 4 })).toEqual({ x: 1, y: 2 });
			expect(lineRightToLeft.projection({ x: 1, y: 4 })).toEqual({ x: 1, y: 2 });
		});
	});
});
