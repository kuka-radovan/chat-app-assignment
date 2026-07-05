import { randomUUID } from 'crypto';
import { IdGenerator } from './id-generator.port';

export class UuidGenerator extends IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
