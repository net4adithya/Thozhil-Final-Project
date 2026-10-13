<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api';

const router = useRouter();
const assignments = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    assignments.value = await adminApi.listAssignments();
  } catch (err) {
    error.value = 'Could not load assignments list.';
  } finally {
    loading.value = false;
  }
});

function openReport(id) {
  router.push(`/reports/${id}`);
}

function newAssignment() {
  router.push('/exams/new');
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-caption text-medium-emphasis">
          <router-link to="/" class="text-decoration-none text-primary font-weight-medium">Dashboard</router-link> / Assignments
        </div>
        <h1 class="text-h5 font-weight-bold">Assignments Management</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Manage job & assessment assignments across all four evaluation modules</div>
      </div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="newAssignment">
        Create Assignment
      </v-btn>
    </div>

    <v-card variant="outlined" class="pa-4">
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Title</th>
            <th class="text-left">Language</th>
            <th class="text-left">Assigned Intern</th>
            <th class="text-left">Access Code</th>
            <th class="text-left">Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="assignments.length === 0">
            <td colspan="6" class="text-center text-medium-emphasis py-4">No assignments found.</td>
          </tr>
          <tr v-for="item in assignments" :key="item.id">
            <td class="font-weight-medium">{{ item.title }}</td>
            <td><v-chip size="small" variant="tonal" color="primary">{{ item.language }}</v-chip></td>
            <td>{{ item.intern?.name || 'Unassigned' }}</td>
            <td class="font-monospace font-weight-bold text-primary">{{ item.accessCode || 'N/A' }}</td>
            <td><v-chip size="small" variant="tonal" color="success">{{ item.status }}</v-chip></td>
            <td class="text-right">
              <v-btn size="small" variant="tonal" color="primary" @click="openReport(item.id)">
                View Unified Report
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
