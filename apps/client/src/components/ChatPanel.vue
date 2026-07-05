<template>
  <section class="chat-panel col column no-wrap">
    <div v-if="error" class="col column flex-center text-center text-negative">
      <q-icon name="error_outline" size="32px" />
      <div class="q-mt-sm text-body2">{{ error }}</div>
    </div>

    <MessageList
      v-else
      class="col"
      :messages="messages"
      :current-user-id="userId"
      :has-more="hasMore"
      :load-older="messagesStore.loadOlderMessages"
    />

    <MessageInput
      ref="messageInputRef"
      v-model="message"
      :sending="sending"
      :error="sendError"
      @send="onSend"
    />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted, ref } from 'vue';
import MessageInput from '@/components/MessageInput.vue';
import MessageList from '@/components/MessageList.vue';
import { useMessageSender } from '@/composables/useMessageSender';
import { useIdentityStore } from '@/stores/identity';
import { useMessagesStore } from '@/stores/messages';

const messagesStore = useMessagesStore();
const identityStore = useIdentityStore();

const { messages, error, hasMore } = storeToRefs(messagesStore);
const { userId } = storeToRefs(identityStore);

const { message, sending, error: sendError, send } = useMessageSender();

const messageInputRef = ref<InstanceType<typeof MessageInput> | null>(null);

async function onSend(): Promise<void> {
  await send();
  messageInputRef.value?.focus();
}

onMounted(() => {
  void messagesStore.loadInitialMessages();
});
</script>

<style scoped lang="scss">
.chat-panel {
  min-width: 0;
  min-height: 0;
  background: $grey-1;
}
</style>
