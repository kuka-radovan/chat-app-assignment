import { IdGenerator } from '../id-generator.port';

/**
 * Deterministic IdGenerator for tests. Yields a predictable sequence of valid
 * UUID strings so that generated ids are reproducible across runs. When a preset
 * list is provided the values are returned in order; otherwise a counter drives
 * the final segment of the UUID.
 */
export class FakeIdGenerator extends IdGenerator {
  private index = 0;

  constructor(private readonly preset: readonly string[] = []) {
    super();
  }

  generate(): string {
    if (this.index < this.preset.length) {
      return this.preset[this.index++];
    }

    const suffix = (this.index + 1).toString(16).padStart(12, '0');
    this.index++;
    return `00000000-0000-4000-8000-${suffix}`;
  }
}
