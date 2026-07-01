import { MessageEmptyError } from '../domain/value-objects/message-content';
import { UserId } from '../../users/domain/value-objects/user-id';
import { SendMessageUseCase } from './send-message.use-case';
import { InMemoryMessageRepository } from './testing/in-memory-message.repository';

describe('SendMessageUseCase', () => {
  it('saves and returns a new message', async () => {
    const repository = new InMemoryMessageRepository();
    const sendMessage = new SendMessageUseCase(repository);
    const authorId = UserId.from('550e8400-e29b-41d4-a716-446655440000');

    const message = await sendMessage.execute({
      authorId,
      content: 'hello',
    });

    expect(message.content.value).toBe('hello');
    expect(message.authorId).toBe(authorId);
    expect(repository.savedMessages()).toEqual([message]);
  });

  it('rejects empty content', async () => {
    const sendMessage = new SendMessageUseCase(new InMemoryMessageRepository());

    await expect(
      sendMessage.execute({
        authorId: UserId.from('550e8400-e29b-41d4-a716-446655440000'),
        content: '   ',
      }),
    ).rejects.toBeInstanceOf(MessageEmptyError);
  });
});
