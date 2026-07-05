import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Clock } from '../common/clock/clock.port';
import { IdGenerator } from '../common/id/id-generator.port';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { ResolveUserByTokenUseCase } from './application/resolve-user-by-token.use-case';
import { UserRepository } from './domain/user.repository';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
import { HttpAuthGuard } from './transport/http-auth.guard';
import { UsersController } from './transport/users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UsersController],
  providers: [
    {
      provide: UserRepository,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (
        userRepository: UserRepository,
        clock: Clock,
        idGenerator: IdGenerator,
      ) => new RegisterUserUseCase(userRepository, clock, idGenerator),
      inject: [UserRepository, Clock, IdGenerator],
    },
    {
      provide: ResolveUserByTokenUseCase,
      useFactory: (userRepository: UserRepository) =>
        new ResolveUserByTokenUseCase(userRepository),
      inject: [UserRepository],
    },
    HttpAuthGuard,
  ],
  exports: [HttpAuthGuard, ResolveUserByTokenUseCase],
})
export class UsersModule {}
