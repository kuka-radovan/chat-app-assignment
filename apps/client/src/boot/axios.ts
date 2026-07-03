import { defineBoot } from '#q-app';
import axios, { type AxiosInstance } from 'axios';
import { config } from '@/config';
import { getToken } from '@/utils/token-storage';

declare module 'vue' {
  interface ComponentCustomProperties {
    $api: AxiosInstance;
  }
}

const api = axios.create({ baseURL: config.apiBaseUrl });

api.interceptors.request.use((requestConfig) => {
  const token = getToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api;
});

export { api };
