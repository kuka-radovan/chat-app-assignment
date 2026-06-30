import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { ListUserDto, RegisterUserResponseDto } from '@chat/shared';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { RegisterUserUseCase } from '../application/register-user.use-case';
import { NicknameAlreadyTakenError } from '../domain/errors';
import { InvalidNicknameError } from '../domain/value-objects/nickname';
import {
  ListUserDtoBody,
  RegisterUserResponseBodyDto,
} from './dto/user.response';
import { RegisterUserBodyDto } from './dto/register-user.body';
import { HttpAuthGuard, type AuthenticatedRequest } from './http-auth.guard';
import { UserPresenter } from './presenters/user.presenter';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly registerUser: RegisterUserUseCase,
    private readonly listUsers: ListUsersUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ type: RegisterUserResponseBodyDto })
  @ApiBadRequestResponse({ description: 'Invalid nickname' })
  @ApiConflictResponse({ description: 'Nickname already taken' })
  async register(
    @Body() registerUserDto: RegisterUserBodyDto,
  ): Promise<RegisterUserResponseDto> {
    try {
      const user = await this.registerUser.execute(registerUserDto.nickname);
      return UserPresenter.toRegisterResponse(user);
    } catch (error) {
      if (error instanceof InvalidNicknameError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof NicknameAlreadyTakenError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }

  @Get('me')
  @UseGuards(HttpAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get the authenticated user' })
  @ApiOkResponse({ type: ListUserDtoBody })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth token' })
  me(@Req() request: AuthenticatedRequest): ListUserDto {
    return {
      userId: request.user.id.value,
      nickname: request.user.nickname.value,
    };
  }

  @Get()
  @UseGuards(HttpAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all registered users' })
  @ApiOkResponse({ type: ListUserDtoBody, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid auth token' })
  async list(): Promise<ListUserDto[]> {
    const users = await this.listUsers.execute();
    return UserPresenter.toListUsers(users);
  }
}
