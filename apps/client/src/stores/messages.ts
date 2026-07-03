import type { MessageDto } from '@chat/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchMessages } from '@/api/messages';

const INITIAL_PAGE_SIZE = 50;

export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<MessageDto[]>([]);
  const error = ref<string | null>(null);

  async function loadInitialMessages(): Promise<void> {
    error.value = null;

    try {
      messages.value = await fetchMessages({ limit: INITIAL_PAGE_SIZE });
    } catch {
      error.value = 'Could not load messages. Please try again.';
    }
  }

  function reset(): void {
    messages.value = [];
    error.value = null;
  }

  return { messages, error, loadInitialMessages, reset };
});
