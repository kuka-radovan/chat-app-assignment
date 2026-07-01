import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListUsersUseCase } from './application/list-users.use-case';
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
