export class IdGenerator {
	constructor(private readonly prefix: string) {}
	private i = 0;
	generate(): string {
		return `${this.prefix}-${this.i++}`;
	}
}
