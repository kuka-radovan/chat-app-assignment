import { config } from '../../../config';

export class MessageContent {
  private constructor(readonly value: string) {}

  static from(rawContent: string): MessageContent {
    const content = rawContent.trim();

    if (content.length === 0) {
      throw new MessageEmptyError();
    }

    if (content.length > config.MESSAGE_MAX_LENGTH) {
      throw new MessageTooLongError(
        `Message must be at most ${config.MESSAGE_MAX_LENGTH} characters`,
      );
    }

    return new MessageContent(content);
  }
}

export class MessageEmptyError extends Error {
  constructor() {
    super('Message must not be empty');
    this.name = 'MessageEmptyError';
  }
}

export class MessageTooLongError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MessageTooLongError';
  }
}
