import type { ListUserDto, RegisterUserResponseDto } from '@chat/shared';
import { api } from '@/boot/axios';

export async function registerUser(
  nickname: string,
): Promise<RegisterUserResponseDto> {
  const { data } = await api.post<RegisterUserResponseDto>('/users', {
    nickname,
  });
  return data;
}

export async function fetchMe(): Promise<ListUserDto> {
  const { data } = await api.get<ListUserDto>('/users/me');
  return data;
}
