import type { MessageDto } from '@chat/shared';
import type { Message } from '../../domain/message';

export class MessagePresenter {
  static toDto(message: Message): MessageDto {
    return {
      messageId: message.id.value,
      authorId: message.author.id.value,
      nickname: message.author.nickname?.value ?? 'unknown',
      content: message.content.value,
      createdAt: message.createdAt.toISOString(),
    };
  }

  static toList(messages: readonly Message[]): MessageDto[] {
    return messages.map((message) => MessagePresenter.toDto(message));
  }
}
