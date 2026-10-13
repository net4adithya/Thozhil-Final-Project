<script setup>
import { ref, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import { authState, clearSession } from '../api/client';

const router = useRouter();
const route = useRoute();
const { mobile } = useDisplay();

const drawerOpen = ref(!mobile.value);

watch(mobile, (isMobile) => {
  drawerOpen.value = !isMobile;
});

const moduleNav = [
  { to: '/resume', title: 'AI Resume Screener', icon: 'mdi-file-document-search-outline' },
  { to: '/interview', title: 'AI Video Interviewer', icon: 'mdi-video-account' },
  { to: '/project-analysis', title: 'AI Project Analyser', icon: 'mdi-chart-timeline-variant' },
  { to: '/coding', title: 'AI Coding Interviewer', icon: 'mdi-code-braces' },
];

function onNavSelect() {
  if (mobile.value) drawerOpen.value = false;
}

function logout() {
  clearSession();
  router.push({ name: 'login' });
}
</script>

<template>
  <v-app-bar v-if="mobile" density="comfortable" flat>
    <v-app-bar-nav-icon @click="drawerOpen = !drawerOpen" />
    <v-app-bar-title class="text-h6 font-weight-bold">
      THOZHIL<span class="text-primary"> Admin</span>
    </v-app-bar-title>
  </v-app-bar>

  <v-navigation-drawer
    v-model="drawerOpen"
    :permanent="!mobile"
    :temporary="mobile"
    width="260"
  >
    <div v-if="!mobile" class="pa-4 pb-2">
      <div class="text-h6 font-weight-bold">
        THOZHIL<span class="text-primary"> Admin</span>
      </div>
    </div>

    <v-list nav density="comfortable">
      <v-list-item
        to="/"
        prepend-icon="mdi-view-dashboard-outline"
        title="Dashboard"
        :active="route.path === '/'"
        rounded="lg"
        @click="onNavSelect"
      />

      <v-divider class="my-2" />

      <v-list-subheader class="font-weight-bold text-caption text-uppercase">Modules</v-list-subheader>
      <v-list-item
        v-for="item in moduleNav"
        :key="item.to"
        :to="item.to"
        :prepend-icon="item.icon"
        :title="item.title"
        :active="route.path === item.to"
        rounded="lg"
        @click="onNavSelect"
      />

      <v-divider class="my-2" />

      <v-list-item
        to="/interns"
        prepend-icon="mdi-account-group-outline"
        title="Intern Details"
        :active="route.path.startsWith('/interns')"
        rounded="lg"
        @click="onNavSelect"
      />
    </v-list>

    <template #append>
      <div class="pa-3 border-t">
        <div class="text-caption text-medium-emphasis mb-2" style="word-break: break-word">
          {{ authState.user?.name || authState.user?.email || 'Admin User' }}
        </div>
        <v-btn block variant="outlined" size="small" color="error" prepend-icon="mdi-logout" @click="logout">
          Log out
        </v-btn>
      </div>
    </template>
  </v-navigation-drawer>

  <v-main>
    <v-container fluid class="pa-4 pa-sm-6 pa-md-8" style="max-width: 1280px">
      <slot />
    </v-container>
  </v-main>
</template>
