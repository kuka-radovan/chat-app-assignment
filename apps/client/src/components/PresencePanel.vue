<template>
  <aside class="presence-panel column no-wrap">
    <div class="presence-header q-pa-md">
      <div class="text-subtitle2 text-weight-medium">People</div>
    </div>

    <q-separator />

    <q-scroll-area class="col">
      <UsersList :users="participants" :error="error" />
    </q-scroll-area>
  </aside>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import UsersList from '@/components/UsersList.vue';
import { useUsersStore } from '@/stores/users';

const usersStore = useUsersStore();

const { participants, error } = storeToRefs(usersStore);
</script>

<style scoped lang="scss">
.presence-panel {
  width: 280px;
  flex-shrink: 0;
  background: white;
  border-left: 1px solid $grey-4;
}

.presence-header {
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .presence-panel {
    display: none;
  }
}
</style>
