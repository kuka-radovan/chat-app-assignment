import { Controller, Get, UseGuards } from '@nestjs/common';
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
import { MessagePresenter } from './presenters/message.presenter';

@ApiTags('messages')
@Controller('messages')
export class MessagesController {
  constructor(private readonly listMessages: ListMessagesUseCase) {}

  @Get()
  @UseGuards(HttpAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all messages' })
  @ApiOkResponse({ type: MessageDtoBody, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth token' })
  async list(): Promise<MessageDto[]> {
    const messages = await this.listMessages.execute();
    return MessagePresenter.toList(messages);
  }
}
