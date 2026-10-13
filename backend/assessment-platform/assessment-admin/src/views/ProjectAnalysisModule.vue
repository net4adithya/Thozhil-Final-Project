<script setup>
import { ref, onMounted } from 'vue';
import { adminApi, projectLogApi } from '../api';

const assignments = ref([]);
const selectedAssignment = ref(null);
const logs = ref([]);
const loading = ref(false);
const error = ref('');

const managerNotes = ref('');
const activeLogId = ref(null);
const updatingNotes = ref(false);

onMounted(async () => {
  try {
    assignments.value = await adminApi.listAssignments();
    await fetchLogs();
  } catch (err) {
    error.value = 'Failed to load project logs.';
  }
});

async function fetchLogs() {
  loading.value = true;
  error.value = '';
  try {
    const assignId = selectedAssignment.value;
    if (assignId) {
      const data = await projectLogApi.getByAssignment(assignId);
      logs.value = data.logs || [];
    } else {
      const all = await adminApi.listAssignments();
      let accumulated = [];
      for (const a of all) {
        const d = await projectLogApi.getByAssignment(a.id);
        if (d.logs) accumulated = accumulated.concat(d.logs);
      }
      logs.value = accumulated;
    }
  } catch (err) {
    logs.value = [];
  } finally {
    loading.value = false;
  }
}

async function saveNotes(logId) {
  updatingNotes.value = true;
  try {
    await projectLogApi.updateNotes(logId, managerNotes.value);
    await fetchLogs();
    activeLogId.value = null;
  } catch (err) {
    error.value = 'Failed to save manager risk notes.';
  } finally {
    updatingNotes.value = false;
  }
}

function parseJsonArray(str) {
  if (!str) return [];
  if (Array.isArray(str)) return str;
  try { return JSON.parse(str); } catch (_) { return [str]; }
}
</script>

<template>
  <div>
    <!-- Navigation Breadcrumbs -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-caption text-medium-emphasis">
          <router-link to="/" class="text-decoration-none text-primary font-weight-medium">Dashboard</router-link> / AI Project Analyser
        </div>
        <h1 class="text-h5 font-weight-bold">AI Project Analyser (LogLense)</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Analyse Intern project work submissions, source code attachments, correctness, code quality, and risk score</div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" to="/">Back to Dashboard</v-btn>
    </div>

    <!-- Filter Card -->
    <v-card variant="outlined" class="mb-6 pa-4">
      <v-row density="compact" align="center">
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedAssignment"
            label="Filter by Assignment"
            :items="assignments"
            item-title="title"
            item-value="id"
            variant="outlined"
            density="compact"
            clearable
            hide-details
            @update:model-value="fetchLogs"
          />
        </v-col>
        <v-col cols="12" md="6" class="text-right">
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="fetchLogs">
            Refresh Project Reviews
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Project Logs Table -->
    <v-card variant="outlined" class="pa-4">
      <v-card-title class="text-h6 font-weight-bold mb-3 pa-0">
        Intern Work Submissions & Multi-LLM Reviews ({{ logs.length }})
      </v-card-title>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Intern</th>
            <th class="text-left">Overall Score</th>
            <th class="text-left">Correctness</th>
            <th class="text-left">Quality</th>
            <th class="text-left">Risk Score</th>
            <th class="text-left">Recommendation</th>
            <th class="text-left">AI Summary</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="logs.length === 0">
            <td colspan="7" class="text-center text-medium-emphasis py-4">No project log reviews found.</td>
          </tr>
          <tr v-for="log in logs" :key="log.id">
            <td class="font-weight-medium">
              <div>{{ log.candidateName || 'Intern' }}</div>
              <div class="text-caption text-medium-emphasis">{{ log.candidateEmail }}</div>
            </td>
            <td>
              <div class="text-h6 font-weight-bold text-primary">{{ log.overallScore }}/100</div>
            </td>
            <td class="font-weight-medium">{{ log.correctnessScore }}/100</td>
            <td class="font-weight-medium">{{ log.qualityScore }}/100</td>
            <td class="font-weight-medium text-warning">{{ log.riskScore }}/100</td>
            <td>
              <v-chip
                size="small"
                :color="log.recommendation === 'APPROVED' ? 'success' : log.recommendation === 'NEEDS_REVISION' ? 'warning' : 'error'"
                variant="flat"
              >
                {{ log.recommendation }}
              </v-chip>
            </td>
            <td>
              <div class="text-caption text-truncate" style="max-width: 250px;">
                {{ log.summary || 'Project review completed.' }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
