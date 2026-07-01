import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { MessageDto } from '@chat/shared';
import { HttpAuthGuard } from '../../users/transport/http-auth.guard';
import { ListMessagesUseCase } from '../application/list-messages.use-case';
import { MessageDtoBody } from './dto/message.response';
import { HistoryQueryDto } from './dto/history.query';
import { MessagePresenter } from './presenters/message.presenter';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly listMessages: ListMessagesUseCase) {}

  @Get()
  @UseGuards(HttpAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List message history' })
  @ApiOkResponse({ type: MessageDtoBody, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth token' })
  async list(@Query() query: HistoryQueryDto): Promise<MessageDto[]> {
    const messages = await this.listMessages.execute({
      limit: query.limit,
      before:
        query.beforeCreatedAt && query.beforeId
          ? {
              createdAt: new Date(query.beforeCreatedAt),
              id: query.beforeId,
            }
          : undefined,
      after:
        query.afterCreatedAt && query.afterId
          ? {
              createdAt: new Date(query.afterCreatedAt),
              id: query.afterId,
            }
          : undefined,
    });

    return MessagePresenter.toList(messages);
  }
}
