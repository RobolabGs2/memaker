/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type Point from '../geometry/point';
import { CanvasCursor } from '../cursor';
import * as PointUtils from '../geometry/point_utils';

export interface Sprite {
	contains(cursor: Point): boolean;
	readonly interactive: boolean;
	draw(ctx: CanvasRenderingContext2D, state: SpriteState): void;
}

export interface DragDropSystem {
	move(from: Point, to: Point, cursor: CanvasCursor): void;
	drop(from: Point, to: Point, cursor: CanvasCursor): void;
}

export type SpriteState = 'default' | 'hover' | 'active';

export class SpriteSystem {
	readonly sprites = new Array<Sprite>();
	readonly cursor: CanvasCursor;
	constructor(
		canvas: HTMLCanvasElement,
		readonly dragDropSystemSource: (sprite: Sprite) => DragDropSystem | undefined,
		public onupdate?: () => void
	) {
		this.cursor = new CanvasCursor(
			canvas,
			() => {
				if (this.dragAndDrop) return true;
				if (!this.hoveredSprite) return false;
				const system = this.dragDropSystemSource(this.hoveredSprite);
				if (!system) return false;
				this.dragAndDrop = {
					sprite: this.hoveredSprite,
					system,
					lastPosition: { x: NaN, y: NaN }
				};
				return true;
			},
			(from, to) => {
				if (!this.dragAndDrop) return false;
				const system = this.dragAndDrop.system;
				this.dragAndDrop = undefined;
				system.drop(from, to, this.cursor);
				return true;
			},
			() => this.update()
		);
	}
	dragAndDrop?: {
		sprite: Sprite;
		system: DragDropSystem;
		lastPosition: Point;
	};
	hoveredSprite?: Sprite;
	add<T extends Sprite>(s: T) {
		this.sprites.push(s);
		return s;
	}
	clear() {
		this.dragAndDrop?.system.drop(this.cursor.moveStart!, this.cursor.position, this.cursor);
		this.dragAndDrop = undefined;
		this.hoveredSprite = undefined;
		this.sprites.length = 0;
	}
	update() {
		if (this.dragAndDrop) {
			if (!PointUtils.equals(this.cursor.position, this.dragAndDrop.lastPosition, 0.001)) {
				this.dragAndDrop.system.move(this.cursor.moveStart!, this.cursor.position, this.cursor);
				this.dragAndDrop.lastPosition.x = this.cursor.position.x;
				this.dragAndDrop.lastPosition.y = this.cursor.position.y;
				this.onupdate?.();
			}
			return;
		}
		// if (this.hoveredSprite?.contains(this.cursor.position)) return;
		const prevHoveredSprite = this.hoveredSprite;
		this.hoveredSprite = undefined;
		for (let i = this.sprites.length - 1; i >= 0; i--) {
			const sprite = this.sprites[i];
			if (sprite.interactive && sprite.contains(this.cursor.position)) {
				this.hoveredSprite = sprite;
				break;
			}
		}
		if (prevHoveredSprite !== this.hoveredSprite) this.onupdate?.();
	}
	draw(ctx: CanvasRenderingContext2D) {
		this.sprites.forEach((s) => {
			ctx.save();
			s.draw(ctx, this.spriteState(s));
			ctx.restore();
		});
	}
	spriteState(sprite: Sprite): SpriteState {
		if (this.dragAndDrop?.sprite === sprite) return 'active';
		if (this.hoveredSprite === sprite) return 'hover';
		return 'default';
	}
}
