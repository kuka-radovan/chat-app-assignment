import { Global, Module } from '@nestjs/common';
import { Clock } from './clock/clock.port';
import { SystemClock } from './clock/system-clock';
import { IdGenerator } from './id/id-generator.port';
import { UuidGenerator } from './id/uuid-generator';

@Global()
@Module({
  providers: [
    {
      provide: Clock,
      useClass: SystemClock,
    },
    {
      provide: IdGenerator,
      useClass: UuidGenerator,
    },
  ],
  exports: [Clock, IdGenerator],
})
export class CommonModule {}
