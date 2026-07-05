import { Clock } from './clock.port';

export class SystemClock extends Clock {
  now(): Date {
    return new Date();
  }
}
