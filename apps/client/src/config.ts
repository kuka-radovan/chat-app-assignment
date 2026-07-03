export const config = {
  apiBaseUrl: import.meta.env.BASE_API_URL ?? '',
  authTokenStorageKey: 'chat.auth.token',
} as const;
