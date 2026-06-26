import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { RegisterUserResponseDto } from '@chat/shared';
import { RegisterUserUseCase } from '../application/register-user.use-case';
import { NicknameAlreadyTakenError } from '../domain/errors';
import { InvalidNicknameError } from '../domain/value-objects/nickname';
import { RegisterUserBodyDto } from './dto/register-user.body';
import { RegisterUserResponseBodyDto } from './dto/register-user.response';
import { UserPresenter } from './presenters/user.presenter';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

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
}
