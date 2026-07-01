import { UserId } from '../../users/domain/value-objects/user-id';
import { ListMessagesUseCase } from './list-messages.use-case';
import { SendMessageUseCase } from './send-message.use-case';
import { InMemoryMessageRepository } from './testing/in-memory-message.repository';

describe('ListMessagesUseCase', () => {
  it('returns an empty list when no messages exist', async () => {
    const repository = new InMemoryMessageRepository();
    const listMessages = new ListMessagesUseCase(repository);

    await expect(listMessages.execute()).resolves.toEqual([]);
  });

  it('returns all messages ordered by creation time', async () => {
    const repository = new InMemoryMessageRepository();
    const sendMessage = new SendMessageUseCase(repository);
    const listMessages = new ListMessagesUseCase(repository);
    const authorId = UserId.from('550e8400-e29b-41d4-a716-446655440000');

    const first = await sendMessage.execute({ authorId, content: 'first' });
    const second = await sendMessage.execute({ authorId, content: 'second' });

    const messages = await listMessages.execute();

    expect(messages).toEqual([first, second]);
    expect(messages.map((message) => message.content.value)).toEqual([
      'first',
      'second',
    ]);
  });
});
