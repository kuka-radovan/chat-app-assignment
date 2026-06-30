export interface RegisterUserDto {
  nickname: string;
}

export interface RegisterUserResponseDto {
  userId: string;
  nickname: string;
  token: string;
}

export interface ListUserDto {
  userId: string;
  nickname: string;
}
