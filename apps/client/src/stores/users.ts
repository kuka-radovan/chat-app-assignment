import type { ListUserDto } from '@chat/shared';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
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

  function setUsers(next: ListUserDto[]): void {
    users.value = next;
  }

  function upsertUser(user: ListUserDto): void {
    const index = users.value.findIndex((u) => u.userId === user.userId);
    if (index >= 0) {
      users.value[index] = user;
    } else {
      users.value.push(user);
    }
  }

  function removeUser(userId: string): ListUserDto | undefined {
    const removed = users.value.find((user) => user.userId === userId);

    users.value = users.value.filter((user) => user.userId !== userId);
    return removed;
  }

  function reset(): void {
    users.value = [];
    error.value = null;
  }

  return { users, error, participants, setUsers, upsertUser, removeUser, reset };
});
