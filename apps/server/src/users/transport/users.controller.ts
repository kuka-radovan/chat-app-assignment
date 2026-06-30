import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { ListUserDto, RegisterUserResponseDto } from '@chat/shared';
import { ListUsersUseCase } from '../application/list-users.use-case';
import { RegisterUserUseCase } from '../application/register-user.use-case';
import { NicknameAlreadyTakenError } from '../domain/errors';
import { InvalidNicknameError } from '../domain/value-objects/nickname';
import { ListUserDtoBody } from './dto/list-users.response';
import { RegisterUserBodyDto } from './dto/register-user.body';
import { RegisterUserResponseBodyDto } from './dto/register-user.response';
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

  @Get()
  @ApiOperation({ summary: 'List all registered users' })
  @ApiOkResponse({ type: ListUserDtoBody, isArray: true })
  async list(): Promise<ListUserDto[]> {
    const users = await this.listUsers.execute();
    return UserPresenter.toListUsers(users);
  }
}
