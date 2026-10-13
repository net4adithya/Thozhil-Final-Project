<script setup>
import { ref, onMounted } from 'vue';
import { adminApi, interviewApi } from '../api';

const assignments = ref([]);
const selectedAssignment = ref(null);
const evaluations = ref([]);
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  try {
    assignments.value = await adminApi.listAssignments();
    await fetchEvaluations();
  } catch (err) {
    error.value = 'Failed to load initial data.';
  }
});

async function fetchEvaluations() {
  loading.value = true;
  error.value = '';
  try {
    const assignId = selectedAssignment.value;
    if (assignId) {
      const data = await interviewApi.getByAssignment(assignId);
      evaluations.value = data.evaluations || [];
    } else {
      const all = await adminApi.listAssignments();
      let accumulated = [];
      for (const a of all) {
        const d = await interviewApi.getByAssignment(a.id);
        if (d.evaluations) accumulated = accumulated.concat(d.evaluations);
      }
      evaluations.value = accumulated;
    }
  } catch (err) {
    evaluations.value = [];
  } finally {
    loading.value = false;
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
          <router-link to="/" class="text-decoration-none text-primary font-weight-medium">Dashboard</router-link> / AI Video Interviewer
        </div>
        <h1 class="text-h5 font-weight-bold">AI Video & Voice Interviewer</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Conduct and evaluate AI-powered interviews with real-time audio turn-taking and proctoring logs</div>
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
            @update:model-value="fetchEvaluations"
          />
        </v-col>
        <v-col cols="12" md="6" class="text-right">
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" @click="fetchEvaluations">
            Refresh Evaluations
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Interview Evaluation Table -->
    <v-card variant="outlined" class="pa-4">
      <v-card-title class="text-h6 font-weight-bold mb-3 pa-0">
        Candidate Interview Evaluations ({{ evaluations.length }})
      </v-card-title>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Candidate</th>
            <th class="text-left">Interview Score</th>
            <th class="text-left">Technical</th>
            <th class="text-left">Communication</th>
            <th class="text-left">Confidence</th>
            <th class="text-left">Recommendation</th>
            <th class="text-left">AI Summary</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="evaluations.length === 0">
            <td colspan="7" class="text-center text-medium-emphasis py-4">No video interview evaluations found.</td>
          </tr>
          <tr v-for="ev in evaluations" :key="ev.id">
            <td class="font-weight-medium">
              <div>{{ ev.candidateName || 'Candidate' }}</div>
              <div class="text-caption text-medium-emphasis">{{ ev.candidateEmail }}</div>
            </td>
            <td>
              <div class="text-h6 font-weight-bold text-primary">{{ ev.interviewScore }}/100</div>
            </td>
            <td class="font-weight-medium">{{ ev.technicalScore }}/100</td>
            <td class="font-weight-medium">{{ ev.communicationScore }}/100</td>
            <td class="font-weight-medium">{{ ev.confidenceScore }}/100</td>
            <td>
              <v-chip
                size="small"
                :color="ev.recommendation === 'SHORTLIST' ? 'success' : ev.recommendation === 'REVIEW' ? 'warning' : 'error'"
                variant="flat"
              >
                {{ ev.recommendation }}
              </v-chip>
            </td>
            <td>
              <div class="text-caption text-truncate" style="max-width: 250px;">
                {{ ev.aiSummary || 'Interview completed successfully.' }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
