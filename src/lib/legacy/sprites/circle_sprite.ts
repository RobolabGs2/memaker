import type { Point } from '$lib/geometry/point';
import { DragAndDropSprite, type SpriteSettings } from './sprite';
import type { SpriteState } from './sprite_system';

export class RingSprite extends DragAndDropSprite {
	constructor(
		public circle: { center: Point; radius: number },
		public width: number,
		interactive = false,
		settings: SpriteSettings
	) {
		super(interactive, settings);
	}
	protected makePath(ctx: CanvasRenderingContext2D, state: SpriteState): void {
		const width = state == 'hover' ? this.width : this.width / 2;
		const r1 = this.circle.radius - width / 2;
		const r2 = r1 + width;
		const { x, y } = this.circle.center;
		if (r1 <= 0) return;
		ctx.beginPath();
		ctx.arc(x, y, r1, 0, 2 * Math.PI, false);
		ctx.moveTo(x + r2, y);
		ctx.arc(x, y, r2, 0, 2 * Math.PI, true);
		ctx.closePath();
	}
	public contains(point: Point): boolean {
		const dx = point.x - this.circle.center.x;
		const dy = point.y - this.circle.center.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		return Math.abs(this.circle.radius - dist) < this.width / 2;
	}
}
