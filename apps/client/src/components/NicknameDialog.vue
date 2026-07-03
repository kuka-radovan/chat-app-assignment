<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    no-esc-dismiss
    no-backdrop-dismiss
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="nickname-card q-pa-lg">
      <div class="column items-center q-mb-md">
        <q-icon name="forum" size="42px" color="primary" />
        <div class="text-h5 text-weight-medium q-mt-sm">Welcome to Chat</div>
        <div class="text-body2 text-grey-8 text-center q-mt-xs">
          Pick a nickname to join the conversation.
        </div>
      </div>

      <q-form @submit.prevent="onSubmit">
        <q-input
          v-model="nickname"
          outlined
          autofocus
          label="Nickname"
          bg-color="white"
          :disable="loading"
          :error="Boolean(error)"
          :error-message="error ?? undefined"
          @keyup.enter="onSubmit"
        />

        <q-btn
          type="submit"
          class="full-width q-mt-md"
          color="primary"
          unelevated
          no-caps
          label="Join chat"
          :loading="loading"
          :disable="!canSubmit"
        />
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue: boolean;
  loading: boolean;
  error?: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [nickname: string];
}>();

const nickname = ref('');

const canSubmit = computed(() => !props.loading && nickname.value.trim().length > 0);

function onSubmit(): void {
  if (!canSubmit.value) {
    return;
  }
  emit('submit', nickname.value.trim());
}
</script>

<style scoped lang="scss">
.nickname-card {
  width: 360px;
  max-width: 90vw;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
}

:deep(.q-dialog__backdrop) {
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  background: rgba(255, 255, 255, 0.12);
}
</style>
