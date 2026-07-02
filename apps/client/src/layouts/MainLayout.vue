<template>
  <q-layout view="lHh Lpr lFf" class="main-layout">
    <q-header class="chat-header" elevated>
      <q-toolbar>
        <q-icon name="forum" size="sm" class="q-mr-sm" />
        <q-toolbar-title class="text-weight-medium"> Chat </q-toolbar-title>

        <q-chip dense color="positive" text-color="white" icon="wifi" label="Connected" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
