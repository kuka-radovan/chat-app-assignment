import { Module } from '@nestjs/common';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { InMemoryUserRepository } from './application/testing/in-memory-user.repository';
import { UserRepository } from './domain/user.repository';
import { UsersController } from './transport/users.controller';

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: UserRepository,
      useClass: InMemoryUserRepository,
    },
    {
      provide: RegisterUserUseCase,
      useFactory: (userRepository: UserRepository) =>
        new RegisterUserUseCase(userRepository),
      inject: [UserRepository],
    },
  ],
})
export class UsersModule {}
