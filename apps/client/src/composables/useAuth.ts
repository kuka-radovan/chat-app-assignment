import axios from 'axios';
import { computed, ref } from 'vue';
import { fetchMe, registerUser } from '@/api/users';
import { useUserStore } from '@/stores/user';
import { clearToken, getToken, setToken } from '@/utils/token-storage';

const authenticated = ref(false);
const initializing = ref(true);
const loading = ref(false);
const error = ref<string | null>(null);

let bootstrapped = false;

function resolveErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (err.response?.status === 409) {
      return 'This nickname is already taken. Please choose another.';
    }
    if (err.response?.status === 400) {
      return 'That nickname is not valid. Please try a different one.';
    }
  }
  return 'Something went wrong. Please try again.';
}

export function useAuth() {
  const isAuthenticated = computed(() => authenticated.value);
  const isInitializing = computed(() => initializing.value);

  async function initAuth(): Promise<void> {
    if (getToken() === null) {
      authenticated.value = false;
      initializing.value = false;
      return;
    }

    try {
      const user = await fetchMe();
      useUserStore().setUser({ userId: user.userId, nickname: user.nickname });

      authenticated.value = true;
    } catch (err) {
      // A stale/invalid token resolves to 401 -> drop it and fall back to registration.
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        clearToken();
        useUserStore().clear();
      }
      authenticated.value = false;
    } finally {
      initializing.value = false;
    }
  }

  async function register(nickname: string): Promise<void> {
    loading.value = true;
    error.value = null;
    try {
      const user = await registerUser(nickname);

      setToken(user.token);
      useUserStore().setUser({ userId: user.userId, nickname: user.nickname });

      authenticated.value = true;
    } catch (err) {
      clearToken();

      authenticated.value = false;
      error.value = resolveErrorMessage(err);
    } finally {
      loading.value = false;
    }
  }

  // Kick off the token check + user hydration exactly once, on first use.
  if (!bootstrapped) {
    bootstrapped = true;
    void initAuth();
  }

  return { isAuthenticated, isInitializing, loading, error, register };
}
