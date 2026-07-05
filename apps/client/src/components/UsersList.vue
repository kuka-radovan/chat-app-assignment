<template>
  <div v-if="error" class="q-pa-md text-center text-negative text-body2">
    {{ error }}
  </div>

  <div v-else-if="users.length === 0" class="q-pa-md text-center text-grey-6 text-body2">
    No one is online right now
  </div>

  <q-list v-else padding>
    <q-item v-for="user in users" :key="user.userId">
      <q-item-section avatar>
        <q-avatar
          size="32px"
          text-color="white"
          :style="{ backgroundColor: avatarColor(user.userId) }"
        >
          {{ initial(user.nickname) }}
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ user.nickname }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script setup lang="ts">
import type { ListUserDto } from '@chat/shared';
import { avatarColor } from '@/utils/avatar-color';

withDefaults(
  defineProps<{
    users: ListUserDto[];
    error?: string | null;
  }>(),
  {
    error: null,
  },
);

function initial(nickname: string): string {
  return nickname.trim().charAt(0).toUpperCase() || '?';
}
</script>
