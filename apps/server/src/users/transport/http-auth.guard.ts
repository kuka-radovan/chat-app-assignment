import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ResolveUserByTokenUseCase } from '../application/resolve-user-by-token.use-case';
import type { User } from '../domain/user';
import { InvalidAuthTokenError } from '../domain/value-objects/auth-token';

export type AuthenticatedRequest = Request & { user: User };

@Injectable()
export class HttpAuthGuard implements CanActivate {
  constructor(private readonly resolveUser: ResolveUserByTokenUseCase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const user = await this.resolveUser.execute(token);
      if (!user) {
        throw new UnauthorizedException();
      }

      request.user = user;
      return true;
    } catch (error) {
      if (error instanceof InvalidAuthTokenError) {
        throw new UnauthorizedException();
      }

      throw error;
    }
  }
}

function extractBearerToken(authorization: string | undefined): string | null {
  const match = /^Bearer\s+(\S+)$/i.exec(authorization ?? '');
  return match?.[1] ?? null;
}
