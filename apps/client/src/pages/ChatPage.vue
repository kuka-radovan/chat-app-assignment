<template>
  <q-page class="chat-page column no-wrap" :class="{ 'auth-background': !isAuthenticated }">
    <div v-if="isInitializing" class="col column flex-center">
      <q-spinner color="white" size="42px" />
    </div>

    <div v-else-if="isAuthenticated" class="row no-wrap col">
      <ChatPanel />
      <PresencePanel />
    </div>

    <NicknameDialog
      v-else
      :model-value="true"
      :loading="loading"
      :error="error"
      @submit="register"
    />
  </q-page>
</template>

<script setup lang="ts">
import ChatPanel from '@/components/ChatPanel.vue';
import NicknameDialog from '@/components/NicknameDialog.vue';
import PresencePanel from '@/components/PresencePanel.vue';
import { useAuth } from '@/composables/useAuth';
import { useSocket } from '@/composables/useSocket';

const { isAuthenticated, isInitializing, loading, error, register } = useAuth();
useSocket();
</script>

<style scoped lang="scss">
.chat-page {
  height: calc(100vh - 50px);
  background: $grey-2;
}

.chat-page.auth-background {
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
}
</style>
