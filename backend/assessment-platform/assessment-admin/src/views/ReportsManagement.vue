<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api';

const router = useRouter();
const reports = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    reports.value = await adminApi.listAssignments();
  } catch (err) {
    error.value = 'Could not load reports list.';
  } finally {
    loading.value = false;
  }
});

function openReport(id) {
  router.push(`/reports/${id}`);
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-caption text-medium-emphasis">
          <router-link to="/" class="text-decoration-none text-primary font-weight-medium">Dashboard</router-link> / Reports
        </div>
        <h1 class="text-h5 font-weight-bold">Unified Assessment Reports</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Aggregated multi-stage AI report cards combining Resume, Interview, Project Analysis, and Coding Assessment</div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" to="/">Back to Dashboard</v-btn>
    </div>

    <v-card variant="outlined" class="pa-4">
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Assignment</th>
            <th class="text-left">Intern</th>
            <th class="text-left">Completed Stages</th>
            <th class="text-left">Review Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="reports.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-4">No evaluation reports available.</td>
          </tr>
          <tr v-for="item in reports" :key="item.id">
            <td class="font-weight-medium">{{ item.title }}</td>
            <td>{{ item.intern?.name || 'Unassigned' }}</td>
            <td>
              <div class="d-flex ga-1 flex-wrap">
                <v-chip size="x-small" :color="item.stages.resumeCount > 0 ? 'success' : 'grey'">Resume</v-chip>
                <v-chip size="x-small" :color="item.stages.interviewCount > 0 ? 'success' : 'grey'">Interview</v-chip>
                <v-chip size="x-small" :color="item.stages.projectLogCount > 0 ? 'success' : 'grey'">Project</v-chip>
                <v-chip size="x-small" :color="item.stages.submissionCount > 0 ? 'success' : 'grey'">Coding</v-chip>
              </div>
            </td>
            <td>
              <v-chip size="small" :color="item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'error' : 'warning'" variant="flat">
                {{ item.status }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn size="small" variant="flat" color="primary" @click="openReport(item.id)">
                Open Full Report
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
