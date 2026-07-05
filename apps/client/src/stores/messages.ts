import type { MessageDto } from '@chat/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchMessages } from '@/api/messages';

const INITIAL_PAGE_SIZE = 50;

function compareByCreatedAtAndId(left: MessageDto, right: MessageDto): number {
  if (left.createdAt !== right.createdAt) {
    return left.createdAt < right.createdAt ? -1 : 1;
  }

  return left.messageId < right.messageId ? -1 : 1;
}

function mergeMessages(
  existing: readonly MessageDto[],
  incoming: readonly MessageDto[],
): MessageDto[] {
  const byId = new Map<string, MessageDto>();

  for (const message of existing) {
    byId.set(message.messageId, message);
  }
  for (const message of incoming) {
    byId.set(message.messageId, message);
  }

  return [...byId.values()].sort(compareByCreatedAtAndId);
}

export const useMessagesStore = defineStore('messages', () => {
  const messages = ref<MessageDto[]>([]);
  const error = ref<string | null>(null);

  async function loadInitialMessages(): Promise<void> {
    error.value = null;

    try {
      const page = await fetchMessages({ limit: INITIAL_PAGE_SIZE });
      // Merge instead of overwrite so live messages that arrived during the
      // fetch (via the message:new listener) are not dropped.
      messages.value = mergeMessages(messages.value, page);
    } catch {
      error.value = 'Could not load messages. Please try again.';
    }
  }

  function addMessage(message: MessageDto): void {
    messages.value = mergeMessages(messages.value, [message]);
  }

  function reset(): void {
    messages.value = [];
    error.value = null;
  }

  return { messages, error, loadInitialMessages, addMessage, reset };
});
