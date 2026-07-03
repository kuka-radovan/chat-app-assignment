import { watch } from 'vue';
import { connectSocket, disconnectSocket } from '@/boot/socket';
import { useAuth } from '@/composables/useAuth';
import { getToken } from '@/utils/token-storage';

let bootstrapped = false;

export function useSocket(): void {
  const { isAuthenticated } = useAuth();

  if (bootstrapped) {
    return;
  }

  bootstrapped = true;

  watch(
    isAuthenticated,
    (authenticated) => {
      if (authenticated) {
        const token = getToken();
        
        if (token) {
          connectSocket(token);
        }
        return;
      }

      disconnectSocket();
    },
    { immediate: true },
  );
}
