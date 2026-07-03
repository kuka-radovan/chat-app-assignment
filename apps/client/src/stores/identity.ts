import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useIdentityStore = defineStore('identity', () => {
  const userId = ref<string | null>(null);
  const nickname = ref<string | null>(null);

  function setUser(user: { userId: string; nickname: string }): void {
    userId.value = user.userId;
    nickname.value = user.nickname;
  }

  function clear(): void {
    userId.value = null;
    nickname.value = null;
  }

  return { userId, nickname, setUser, clear };
});
