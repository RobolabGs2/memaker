import Polygon from './polygon';
import { describe, it, expect } from 'vitest';

describe('Polygon.contains', () => {
	//    0    1    2    3
	// 0  ┼─────────────────
	//    │
	// 1  ┼              a (3, 1)
	//    │
	// 2  ┼    c (1, 2)
	//    │
	// 3  ┼
	//    │
	// 4  ┼              b (3, 4)
	const a = { x: 3, y: 1 };
	const b = { x: 3, y: 4 };
	const c = { x: 1, y: 2 };
	const p = new Polygon([a, b, c]);
	it('should return true if contains point', () => {
		expect(p.contains({ x: 2, y: 2 })).toBeTruthy();
		expect(p.contains({ x: 1.5, y: 2.1 })).toBeTruthy();
	});
	it('should return false if does not contain point', () => {
		expect(p.contains({ x: -2, y: 2 })).toBeFalsy();
		expect(p.contains({ x: 1, y: 1 })).toBeFalsy();
		expect(p.contains({ x: 3, y: 5 })).toBeFalsy();
	});
});
