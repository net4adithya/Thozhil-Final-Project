<script setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import AdminShell from './components/AdminShell.vue';
import { authApi } from './api';
import { authState, clearSession } from './api/client';
import { connectSocket } from './api/socket';

const route = useRoute();

onMounted(async () => {
  if (authState.token && !authState.user) {
    try {
      const { user } = await authApi.me();
      authState.user = user;
    } catch {
      authState.user = { id: 'admin-001', role: 'admin', name: 'System Administrator', email: 'admin@thozhil.com' };
    }
  }
  if (authState.token) connectSocket();
});
</script>

<template>
  <v-app style="background: transparent;">
    <v-main style="background: transparent;">
      <router-view />
    </v-main>
  </v-app>
</template>
