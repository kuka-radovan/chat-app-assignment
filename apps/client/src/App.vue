<template>
  <div v-if="isInitializing" class="auth-background flex flex-center">
    <q-spinner color="white" size="42px" />
  </div>

  <router-view v-else-if="isAuthenticated" />

  <template v-else>
    <div class="auth-background" />
    <NicknameDialog
      :model-value="true"
      :loading="loading"
      :error="error"
      @submit="register"
    />
  </template>
</template>

<script setup lang="ts">
import NicknameDialog from '@/components/NicknameDialog.vue';
import { useAuth } from '@/composables/useAuth';

const { isAuthenticated, isInitializing, loading, error, register } = useAuth();
</script>

<style scoped lang="scss">
.auth-background {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, $primary 0%, $secondary 100%);
}
</style>
