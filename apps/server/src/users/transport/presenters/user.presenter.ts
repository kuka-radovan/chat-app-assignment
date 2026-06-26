import type { RegisterUserResponseDto } from '@chat/shared';
import type { User } from '../../domain/user';

export class UserPresenter {
  static toRegisterResponse(user: User): RegisterUserResponseDto {
    return {
      userId: user.id.value,
      nickname: user.nickname.value,
      token: user.token.value,
    };
  }
}
