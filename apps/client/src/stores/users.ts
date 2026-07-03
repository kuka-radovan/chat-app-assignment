import type { ListUserDto } from '@chat/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { fetchUsers } from '@/api/users';
import { useIdentityStore } from '@/stores/identity';

export const useUsersStore = defineStore('users', () => {
  const users = ref<ListUserDto[]>([]);
  const error = ref<string | null>(null);

  const participants = computed<ListUserDto[]>(() => {
    const currentUserId = useIdentityStore().userId;
    return users.value
      .filter((user) => user.userId !== currentUserId)
      .sort((a, b) => a.nickname.localeCompare(b.nickname));
  });

  async function loadParticipants(): Promise<void> {
    error.value = null;

    try {
      users.value = await fetchUsers();
    } catch {
      error.value = 'Could not load users. Please try again.';
    }
  }

  function upsertUser(user: ListUserDto): void {
    const index = users.value.findIndex((u) => u.userId === user.userId);
    if (index >= 0) {
      users.value[index] = user;
    } else {
      users.value.push(user);
    }
  }

  function reset(): void {
    users.value = [];
    error.value = null;
  }

  return { users, error, participants, loadParticipants, upsertUser, reset };
});
