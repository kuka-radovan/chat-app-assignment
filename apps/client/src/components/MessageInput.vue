<template>
  <div class="message-input-bar q-pa-md">
    <q-input
      v-model="message"
      outlined
      dense
      placeholder="Type a message…"
      bg-color="white"
      class="col"
      :disable="sending"
      :error="Boolean(error)"
      :error-message="error ?? undefined"
      @keyup.enter="emitSend"
    >
      <template #append>
        <q-btn
          round
          flat
          icon="send"
          color="primary"
          :loading="sending"
          :disable="!canSend"
          @click="emitSend"
        />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const message = defineModel<string>({ default: '' });

const props = withDefaults(
  defineProps<{
    sending?: boolean;
    error?: string | null;
  }>(),
  {
    sending: false,
    error: null,
  },
);

const emit = defineEmits<{
  send: [];
}>();

const canSend = computed(() => message.value.trim().length > 0 && !props.sending);

function emitSend(): void {
  if (!canSend.value) {
    return;
  }

  emit('send');
}
</script>

<style scoped lang="scss">
.message-input-bar {
  border-top: 1px solid $grey-4;
  background: white;
}
</style>
