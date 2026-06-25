import type { Nickname } from './value-objects/nickname';

export class NicknameAlreadyTakenError extends Error {
  constructor(readonly nickname: Nickname) {
    super(`Nickname "${nickname.value}" is already taken`);
    this.name = 'NicknameAlreadyTakenError';
  }
}
