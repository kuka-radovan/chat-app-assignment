<template>
  <div class="message-row row items-end no-wrap q-gutter-sm" :class="{ reverse: own }">
    <q-avatar
      size="36px"
      text-color="white"
      :style="{ backgroundColor: avatarColor(message.authorId) }"
    >
      {{ avatarInitial(message.nickname) }}
    </q-avatar>

    <q-chat-message
      class="message-bubble col"
      :name="message.nickname"
      :text="[message.content]"
      :sent="own"
      :stamp="time"
      :bg-color="own ? 'primary' : 'white'"
      :text-color="own ? 'white' : 'dark'"
    />
  </div>
</template>

<script setup lang="ts">
import type { MessageDto } from '@chat/shared';
import { computed } from 'vue';
import { avatarColor, avatarInitial } from '@/utils/avatar';

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

  // QChatMessage assumes it owns the avatar column and adds its own outer
  // margin + bottom spacing; the row gutter and MessageList spacing handle
  // that here, so neutralize them.
  :deep(.q-message-container) {
    margin: 0;
  }

  :deep(.q-message-text-content) {
    word-break: break-word;
    white-space: pre-wrap;
  }
}
</style>
