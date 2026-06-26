import { User } from '../../domain/user';
import { AuthToken } from '../../domain/value-objects/auth-token';
import { Nickname } from '../../domain/value-objects/nickname';
import { UserId } from '../../domain/value-objects/user-id';
import { UserOrmEntity } from '../user.orm-entity';

export class UserMapper {
  static toOrm(user: User): UserOrmEntity {
    const entity = new UserOrmEntity();

    entity.id = user.id.value;
    entity.nickname = user.nickname.value;
    entity.token = user.token.value;
    entity.createdAt = user.createdAt;

    return entity;
  }

  static toDomain(entity: UserOrmEntity): User {
    return User.reconstitute({
      id: UserId.from(entity.id),
      nickname: Nickname.from(entity.nickname),
      token: AuthToken.from(entity.token),
      createdAt: entity.createdAt,
    });
  }
}
