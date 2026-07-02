<template>
  <div class="message-input-bar q-pa-md">
    <q-input
      v-model="draft"
      outlined
      dense
      placeholder="Type a message…"
      bg-color="white"
      class="col"
    >
      <template #append>
        <q-btn round flat icon="send" color="primary" :disable="!draft.trim()" />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const draft = ref('');
</script>

<style scoped lang="scss">
.message-input-bar {
  border-top: 1px solid $grey-4;
  background: white;
}
</style>
