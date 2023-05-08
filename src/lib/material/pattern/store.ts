import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';

export interface Pattern {
	name: string;
	textureId: string;
}

export class PatternsManager implements Readable<Pattern[]> {
	subscribers = new Set<(v: Pattern[]) => void>();
	constructor(private patterns = new Array<Pattern>()) {}
	subscribe(run: Subscriber<Pattern[]>): Unsubscriber {
		this.subscribers.add(run);
		run(this.patterns);
		return () => {
			this.subscribers.delete(run);
		};
	}
	addPattern(...patterns: Pattern[]) {
		this.patterns = this.patterns.filter((p) => !patterns.find((newP) => newP.name == p.name));
		this.patterns.push(...patterns);
		this.subscribers.forEach((s) => s(this.patterns));
	}
	getTexture(patternName: string) {
		const pattern = this.patterns.find((p) => p.name == patternName);
		if (!pattern) throw new Error(`Not found pattern '${patternName}'`);
		return pattern.textureId;
	}
	has(patternName: string) {
		const pattern = this.patterns.find((p) => p.name == patternName);
		return pattern != null;
	}
}

export const patternsNames = new PatternsManager();
