<template>
  <q-page class="chat-page column no-wrap">
    <div class="chat-body row no-wrap col">
      <section class="messages-panel col column no-wrap">
        <q-scroll-area class="col">
          <div class="message-list q-pa-md" />
        </q-scroll-area>

        <MessageInput />
      </section>

      <PresencePanel />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import MessageInput from '@/components/MessageInput.vue';
import PresencePanel from '@/components/PresencePanel.vue';
</script>

<style scoped lang="scss">
.chat-page {
  height: calc(100vh - 50px);
  background: $grey-2;
}

.chat-body {
  min-height: 0;
}

.messages-panel {
  min-width: 0;
  background: $grey-1;
}

.message-list {
  min-height: 100%;
}
</style>
