<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-header class="chat-header" elevated>
      <q-toolbar>
        <q-icon name="forum" size="sm" class="q-mr-sm" />
        <q-toolbar-title class="text-weight-medium"> Chat </q-toolbar-title>

        <div v-if="nickname" class="text-body2 text-weight-medium">
          {{ nickname }}
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useIdentityStore } from '@/stores/identity';

const { nickname } = storeToRefs(useIdentityStore());
</script>
