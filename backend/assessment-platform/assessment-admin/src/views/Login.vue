<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authApi } from '../api';
import { setSession } from '../api/client';
import { connectSocket } from '../api/socket';

const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function submit() {
  loading.value = true;
  error.value = '';
  try {
    const { user, token } = await authApi.login(email.value, password.value);
    setSession(token, user);
    connectSocket();
    router.push(route.query.redirect || { name: 'dashboard' });
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed.';
  } finally {
    loading.value = false;
  }
}

const DEMO_EMAIL = 'authority@platform.com';
const DEMO_PASSWORD = 'admin123';

function fillDemoCredentials() {
  email.value = DEMO_EMAIL;
  password.value = DEMO_PASSWORD;
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center" class="fill-height">
      <v-col cols="12" sm="8" md="4">
        <v-card elevation="4" class="pa-6">
          <div class="text-overline text-primary mb-1">Assessment platform</div>
          <div class="text-h5 font-weight-bold mb-6">Admin sign in</div>

          <v-form @submit.prevent="submit">
            <v-text-field
              v-model="email"
              label="Email"
              type="email"
              autocomplete="username"
              prepend-inner-icon="mdi-email-outline"
              required
            />
            <v-text-field
              v-model="password"
              label="Password"
              type="password"
              autocomplete="current-password"
              prepend-inner-icon="mdi-lock-outline"
              required
            />
            <v-alert v-if="error" type="error" variant="tonal" density="compact" class="mb-4">
              {{ error }}
            </v-alert>
            <v-btn type="submit" color="primary" block size="large" :loading="loading">
              Sign in
            </v-btn>
          </v-form>

          <v-divider class="my-5" />

          <div class="text-caption text-medium-emphasis mb-2">
            Just want to look around? Use the demo admin account.
          </div>
          <v-chip
            variant="tonal"
            color="primary"
            prepend-icon="mdi-account-key-outline"
            class="w-100 justify-start"
            style="height: auto; padding-top: 8px; padding-bottom: 8px;"
            @click="fillDemoCredentials"
          >
            <div class="d-flex flex-column align-start text-caption" style="line-height: 1.4;">
              <span class="font-weight-medium">Click to autofill demo credentials</span>
              <span class="text-medium-emphasis">{{ DEMO_EMAIL }} · {{ DEMO_PASSWORD }}</span>
            </div>
          </v-chip>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
