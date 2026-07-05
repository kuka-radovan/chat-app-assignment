<template>
  <div
    class="message-row row items-start no-wrap q-gutter-sm"
    :class="{ 'own-message reverse': own }"
  >
    <q-avatar
      size="36px"
      text-color="white"
      :style="{ backgroundColor: avatarColor(message.authorId) }"
    >
      {{ message.nickname.charAt(0) || '?' }}
    </q-avatar>
    <div class="message-bubble column">
      <div class="row items-baseline q-gutter-xs">
        <span class="text-caption text-weight-medium">{{ message.nickname }}</span>
        <span class="text-caption text-grey-6">{{ time }}</span>
      </div>
      <div class="message-content text-body2">{{ message.content }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MessageDto } from '@chat/shared';
import { computed } from 'vue';
import { avatarColor } from '@/utils/avatar-color';

const props = withDefaults(
  defineProps<{
    message: MessageDto;
    own?: boolean;
  }>(),
  {
    own: false,
  },
);

const time = computed(() =>
  new Date(props.message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  }),
);
</script>

<style scoped lang="scss">
.message-row {
  width: 100%;
}

.message-bubble {
  min-width: 0;
  max-width: 75%;
}

.message-content {
  background: white;
  border: 1px solid $grey-4;
  border-radius: 12px;
  padding: 8px 12px;
  word-break: break-word;
  white-space: pre-wrap;
}

.own-message {
  .message-bubble {
    align-items: flex-end;
  }

  .message-content {
    background: $primary;
    color: white;
    border-color: $primary;
  }
}
</style>
