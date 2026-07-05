import { type Ref, ref } from 'vue';
import { sendMessage } from '@/boot/socket';

interface UseMessageSender {
  message: Ref<string>;
  sending: Ref<boolean>;
  error: Ref<string | null>;
  send: () => Promise<void>;
}

export function useMessageSender(): UseMessageSender {
  const message = ref('');
  const sending = ref(false);
  const error = ref<string | null>(null);

  async function send(): Promise<void> {
    const content = message.value.trim();
    if (content.length === 0 || sending.value) {
      return;
    }

    sending.value = true;
    error.value = null;

    const result = await sendMessage(content);

    sending.value = false;

    if (result.ok) {
      message.value = '';
      return;
    }

    error.value = result.error.message;
  }

  return { message, sending, error, send };
}
