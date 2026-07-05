<template>
  <div v-if="messages.length === 0" class="column flex-center text-center text-grey-6">
    <q-icon name="forum" size="32px" />
    <div class="q-mt-sm text-body2">No messages yet. Say hello!</div>
  </div>

  <div v-else ref="scrollRef" class="message-scroll scroll-y col">
    <q-infinite-scroll reverse :offset="LOAD_MORE_OFFSET_PX" :disable="!hasMore" @load="onLoad">
      <template #loading>
        <div class="row flex-center q-py-sm">
          <q-spinner color="primary" size="24px" />
        </div>
      </template>

      <div class="message-list q-pa-md column q-gutter-md">
        <MessageBubble
          v-for="message in messages"
          :key="message.messageId"
          :message="message"
          :own="message.authorId === currentUserId"
        />
      </div>
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import type { MessageDto } from '@chat/shared';
import { nextTick, ref, watch } from 'vue';
import MessageBubble from '@/components/MessageBubble.vue';

// Distance from the top (px) at which the previous page starts prefetching.
const LOAD_MORE_OFFSET_PX = 250;

const props = withDefaults(
  defineProps<{
    messages: MessageDto[];
    currentUserId?: string | null;
    hasMore?: boolean;
    loadOlder?: () => Promise<void>;
  }>(),
  {
    currentUserId: null,
    hasMore: false,
  },
);

const scrollRef = ref<HTMLElement | null>(null);

// Follow the conversation when a newer message is appended (initial load or a
// live message). Prepended older pages keep the same last id, so this stays
// put — QInfiniteScroll maintains scroll position for those.
watch(
  () => props.messages.at(-1)?.messageId,
  (latestId) => {
    if (latestId) {
      void scrollToBottom();
    }
  },
);

async function onLoad(_index: number, done: (stop?: boolean) => void): Promise<void> {
  await props.loadOlder?.();
  done(!props.hasMore);
}

async function scrollToBottom(): Promise<void> {
  await nextTick();
  requestAnimationFrame(() => {
    const el = scrollRef.value;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  });
}
</script>

<style scoped lang="scss">
.message-scroll {
  min-height: 0;
}

.message-list {
  width: 100%;
}
</style>
