import { defineStore } from '#q-app';
import { createPinia } from 'pinia';

export default defineStore(() => {
  const pinia = createPinia();
  return pinia;
});
