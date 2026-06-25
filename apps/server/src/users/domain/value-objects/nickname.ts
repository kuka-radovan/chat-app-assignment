export const NICKNAME_MAX_LENGTH = 32;
const NICKNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export class Nickname {
  private constructor(readonly value: string) {}

  static from(rawNickname: string): Nickname {
    const nickname = rawNickname.trim();

    if (nickname.length === 0) {
      throw new InvalidNicknameError('Nickname must not be empty');
    }

    if (nickname.length > NICKNAME_MAX_LENGTH) {
      throw new InvalidNicknameError(
        `Nickname must be at most ${NICKNAME_MAX_LENGTH} characters`,
      );
    }

    if (!NICKNAME_PATTERN.test(nickname)) {
      throw new InvalidNicknameError(
        'Nickname may only contain letters, numbers, underscores, and hyphens',
      );
    }

    return new Nickname(nickname);
  }
}

export class InvalidNicknameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNicknameError';
  }
}

export class NicknameAlreadyTakenError extends Error {
  constructor(readonly nickname: Nickname) {
    super(`Nickname "${nickname.value}" is already taken`);
    this.name = 'NicknameAlreadyTakenError';
  }
}
