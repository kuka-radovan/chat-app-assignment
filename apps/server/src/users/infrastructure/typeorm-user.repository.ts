import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { NicknameAlreadyTakenError } from '../domain/errors';
import type { User } from '../domain/user';
import { UserRepository } from '../domain/user.repository';
import type { Nickname } from '../domain/value-objects/nickname';
import { UserMapper } from './mappers/user.mapper';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly users: Repository<UserOrmEntity>,
  ) {
    super();
  }

  async save(user: User): Promise<void> {
    try {
      await this.users.save(UserMapper.toOrm(user));
    } catch (error) {
      if (isNicknameUniqueViolation(error)) {
        throw new NicknameAlreadyTakenError(user.nickname);
      }

      throw error;
    }
  }

  async findByNickname(nickname: Nickname): Promise<User | null> {
    const entity = await this.users.findOne({
      where: { nickname: nickname.value },
    });

    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findAll(): Promise<User[]> {
    const entities = await this.users.find({
      order: { createdAt: 'ASC' },
    });

    return entities.map((entity) => UserMapper.toDomain(entity));
  }
}

function isNicknameUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }

  const driverError = error.driverError as { code?: string; detail?: string };
  return (
    driverError.code === '23505' &&
    driverError.detail?.includes('(nickname)') === true
  );
}
