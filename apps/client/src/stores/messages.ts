import type { MessageDto } from '@chat/shared';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { fetchMessages } from '@/api/messages';

const PAGE_SIZE = 10;

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
  const hasMore = ref(true);
  const loadingOlder = ref(false);

  async function loadInitialMessages(): Promise<void> {
    error.value = null;

    try {
      const page = await fetchMessages({ limit: PAGE_SIZE });
      hasMore.value = page.length === PAGE_SIZE;
      // Merge instead of overwrite so live messages that arrived during the
      // fetch (via the message:new listener) are not dropped.
      messages.value = mergeMessages(messages.value, page);
    } catch {
      error.value = 'Could not load messages. Please try again.';
    }
  }

  async function loadOlderMessages(): Promise<void> {
    if (loadingOlder.value || !hasMore.value) {
      return;
    }

    const oldest = messages.value[0];
    if (!oldest) {
      return;
    }

    loadingOlder.value = true;

    try {
      const page = await fetchMessages({
        limit: PAGE_SIZE,
        beforeCreatedAt: oldest.createdAt,
        beforeId: oldest.messageId,
      });
      hasMore.value = page.length === PAGE_SIZE;
      messages.value = mergeMessages(messages.value, page);
    } catch {
      // Keep hasMore untouched so the user can retry by scrolling up again;
      // a failed page must not tear down the whole conversation view.
    } finally {
      loadingOlder.value = false;
    }
  }

  function addMessage(message: MessageDto): void {
    messages.value = mergeMessages(messages.value, [message]);
  }

  function reset(): void {
    messages.value = [];
    error.value = null;
    hasMore.value = true;
    loadingOlder.value = false;
  }

  return {
    messages,
    error,
    hasMore,
    loadingOlder,
    loadInitialMessages,
    loadOlderMessages,
    addMessage,
    reset,
  };
});
