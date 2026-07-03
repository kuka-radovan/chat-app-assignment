<template>
  <div v-if="messages.length === 0" class="column flex-center text-center text-grey-6">
    <q-icon name="forum" size="32px" />
    <div class="q-mt-sm text-body2">No messages yet. Say hello!</div>
  </div>

  <q-scroll-area
    v-else
    :content-style="{ width: '100%' }"
    :content-active-style="{ width: '100%' }"
  >
    <div class="message-list q-pa-md column q-gutter-md">
      <MessageBubble
        v-for="message in messages"
        :key="message.messageId"
        :message="message"
        :own="message.authorId === currentUserId"
      />
    </div>
  </q-scroll-area>
</template>

<script setup lang="ts">
import type { MessageDto } from '@chat/shared';
import MessageBubble from '@/components/MessageBubble.vue';

withDefaults(
  defineProps<{
    messages: MessageDto[];
    currentUserId?: string | null;
  }>(),
  {
    currentUserId: null,
  },
);
</script>

<style scoped lang="scss">
.message-list {
  width: 100%;
}
</style>
