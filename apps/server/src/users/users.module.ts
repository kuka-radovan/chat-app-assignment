import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListUsersUseCase } from './application/list-users.use-case';
import { RegisterUserUseCase } from './application/register-user.use-case';
import { UserRepository } from './domain/user.repository';
import { TypeOrmUserRepository } from './infrastructure/typeorm-user.repository';
import { UserOrmEntity } from './infrastructure/user.orm-entity';
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
      useFactory: (userRepository: UserRepository) =>
        new RegisterUserUseCase(userRepository),
      inject: [UserRepository],
    },
    {
      provide: ListUsersUseCase,
      useFactory: (userRepository: UserRepository) =>
        new ListUsersUseCase(userRepository),
      inject: [UserRepository],
    },
  ],
})
export class UsersModule {}
