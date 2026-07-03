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
    />

    <MessageInput />
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onMounted } from 'vue';
import MessageInput from '@/components/MessageInput.vue';
import MessageList from '@/components/MessageList.vue';
import { useIdentityStore } from '@/stores/identity';
import { useMessagesStore } from '@/stores/messages';

const messagesStore = useMessagesStore();
const identityStore = useIdentityStore();

const { messages, error } = storeToRefs(messagesStore);
const { userId } = storeToRefs(identityStore);

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
