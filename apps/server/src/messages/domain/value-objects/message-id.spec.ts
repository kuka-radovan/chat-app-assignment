import { FakeIdGenerator } from '../../../common/id/testing/fake-id-generator';
import { MessageId } from './message-id';

describe('MessageId', () => {
  it('generates a valid UUID', () => {
    const id = MessageId.generate(new FakeIdGenerator());
    expect(MessageId.from(id.value)).toEqual(id);
  });

  it('rejects invalid id strings', () => {
    expect(() => MessageId.from('not-a-uuid')).toThrow(
      'Invalid message id: not-a-uuid',
    );
    expect(() => MessageId.from('')).toThrow('Invalid message id: ');
  });
});
