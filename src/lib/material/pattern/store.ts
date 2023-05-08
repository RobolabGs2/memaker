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
	addPattern(...newPatterns: Pattern[]) {
		this.patterns = this.patterns.filter((p) => !newPatterns.find((newP) => newP.name == p.name));
		this.patterns.push(...newPatterns);
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
	delete(patternName: string) {
		this.patterns.splice(
			this.patterns.findIndex((p) => p.name == patternName),
			1
		);
		this.subscribers.forEach((s) => s(this.patterns));
	}
	clear() {
		this.patterns = [];
		this.subscribers.forEach((s) => s(this.patterns));
	}
}

export const patternsNames = new PatternsManager();
