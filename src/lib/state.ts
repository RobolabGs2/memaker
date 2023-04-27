import type { Updater, Writable } from 'svelte/store';

export class StateStore<T extends object> implements Writable<T> {
	subscribers = new Set<(v: T) => void>();
	constructor(public value: T) {}
	update(updater: Updater<T>): void {
		this.set(updater(this.value));
	}
	subscribe(subscription: (value: T) => void) {
		subscription(this.value);
		this.subscribers.add(subscription);
		return () => {
			this.subscribers.delete(subscription);
		};
	}
	set(value: T) {
		this.value = value;
		this.subscribers.forEach((s) => s(value));
	}
}

export function deepEqual<T>(a: T, b: T): boolean {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;
	if (typeof a === 'number' && isNaN(a) && isNaN(b as number)) return true;
	if (typeof a !== 'object') return false;
	if (typeof b !== 'object') return false;
	if (a === null || b === null) return false;
	if (Array.isArray(a)) {
		if (Array.isArray(b)) {
			if (a.length != b.length) return false;
			for (let i = 0; i < a.length; i++) {
				if (!deepEqual(a[i], b[i])) return false;
			}
			return true;
		}
		return false;
	}
	if (Array.isArray(b)) return false;
	// a and b - object
	const aKeys = Object.keys(a);
	const bKeys = Object.keys(b);
	if (aKeys.length !== bKeys.length) return false;
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	for (const key of keys) if (!deepEqual((a as any)[key], (b as any)[key])) return false;

	return true;
}

export function deepCopy<T>(a: T): T {
	return JSON.parse(JSON.stringify(a));
}
