import { ZodValidationException, ZodValidationPipe } from 'nestjs-zod';
import { HistoryQueryDto } from './history.query';

describe('HistoryQueryDto validation', () => {
  const pipe = new ZodValidationPipe();
  const metadata = {
    type: 'query' as const,
    metatype: HistoryQueryDto,
    data: '',
  };

  it('accepts flat before cursor query params', () => {
    expect(
      pipe.transform(
        {
          limit: '50',
          beforeCreatedAt: '2026-01-01T00:00:00.000Z',
          beforeId: '9a6d69b0-05a6-412d-aee4-77287e7b23cf',
        },
        metadata,
      ),
    ).toEqual({
      limit: 50,
      beforeCreatedAt: '2026-01-01T00:00:00.000Z',
      beforeId: '9a6d69b0-05a6-412d-aee4-77287e7b23cf',
    });
  });

  it('rejects a partial before cursor', () => {
    expect(() => {
      pipe.transform(
        {
          beforeCreatedAt: '2026-01-01T00:00:00.000Z',
        },
        metadata,
      );
    }).toThrow(ZodValidationException);
  });

  it('rejects before and after together', () => {
    expect(() => {
      pipe.transform(
        {
          beforeCreatedAt: '2026-01-01T00:00:00.000Z',
          beforeId: '10000000-0000-4000-8000-000000000001',
          afterCreatedAt: '2026-01-02T00:00:00.000Z',
          afterId: '20000000-0000-4000-8000-000000000002',
        },
        metadata,
      );
    }).toThrow(ZodValidationException);
  });

  it('rejects a malformed cursor', () => {
    expect(() => {
      pipe.transform(
        {
          beforeCreatedAt: 'not-a-date',
          beforeId: '10000000-0000-4000-8000-000000000001',
        },
        metadata,
      );
    }).toThrow(ZodValidationException);
  });
});
