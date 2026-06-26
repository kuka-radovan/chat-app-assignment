import { ZodValidationException, ZodValidationPipe } from 'nestjs-zod';
import { RegisterUserBodyDto } from './register-user.body';

describe('RegisterUserBodyDto validation', () => {
  const pipe = new ZodValidationPipe();
  const metadata = {
    type: 'body' as const,
    metatype: RegisterUserBodyDto,
    data: '',
  };

  it('passes valid input through', () => {
    expect(pipe.transform({ nickname: 'alice' }, metadata)).toEqual({
      nickname: 'alice',
    });
  });

  it('rejects a missing nickname', () => {
    expect(() => {
      pipe.transform({}, metadata);
    }).toThrow(ZodValidationException);
  });

  it('rejects unknown fields', () => {
    expect(() => {
      pipe.transform({ username: 'alice' }, metadata);
    }).toThrow(ZodValidationException);
  });
});
