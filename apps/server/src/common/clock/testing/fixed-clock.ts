import { Clock } from '../clock.port';

export class FixedClock extends Clock {
  constructor(private readonly fixed: Date) {
    super();
  }

  now(): Date {
    return this.fixed;
  }
}
