<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { adminApi } from '../api';

const route = useRoute();
const internId = route.params.id;

const data = ref(null);
const loading = ref(true);
const error = ref('');

onMounted(loadHistory);

async function loadHistory() {
  loading.value = true;
  error.value = '';
  try {
    const res = await adminApi.getInternHistory(internId);
    data.value = res;
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to load intern assessment history.';
  } finally {
    loading.value = false;
  }
}

function statusColor(status) {
  return {
    APPROVED: 'success',
    REJECTED: 'error',
    RESUBMISSION_REQUESTED: 'warning',
    PENDING_REVIEW: 'info',
    DRAFT: 'default',
    PUBLISHED: 'primary',
  }[status] || 'default';
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Intern Assessment History</h1>
        <div v-if="data" class="text-subtitle-2 text-medium-emphasis">
          {{ data.intern.name }} ({{ data.intern.email }}) — {{ data.intern.institution }}
        </div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" to="/">Back to Dashboard</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <div v-else-if="data">
      <v-card variant="outlined" class="mb-6 pa-4">
        <v-row density="compact">
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Intern Name</div>
            <div class="text-subtitle-1 font-weight-bold">{{ data.intern.name }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Email</div>
            <div class="text-subtitle-1 font-weight-bold">{{ data.intern.email }}</div>
          </v-col>
          <v-col cols="12" sm="4">
            <div class="text-caption text-medium-emphasis">Institution</div>
            <div class="text-subtitle-1 font-weight-bold">{{ data.intern.institution }}</div>
          </v-col>
        </v-row>
      </v-card>

      <h2 class="text-h6 font-weight-bold mb-4">Assigned Assessments History ({{ data.assessmentHistory.length }})</h2>

      <v-alert v-if="data.assessmentHistory.length === 0" type="info" variant="tonal">
        No assessments have been assigned to this intern yet.
      </v-alert>

      <v-row v-else>
        <v-col v-for="item in data.assessmentHistory" :key="item.assignmentId" cols="12" md="6">
          <v-card variant="outlined" hover>
            <v-card-item>
              <template #append>
                <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                  {{ item.status }}
                </v-chip>
              </template>
              <v-card-title class="text-subtitle-1 font-weight-bold">{{ item.title }}</v-card-title>
              <v-card-subtitle class="text-caption text-medium-emphasis">
                Language: {{ item.language || 'Multi-language' }}
              </v-card-subtitle>
            </v-card-item>
            <v-card-text>
              <p class="text-body-2 mb-3 text-truncate">{{ item.description }}</p>
              <div class="d-flex ga-2 flex-wrap text-caption">
                <v-chip size="x-small" :color="item.resumeEvaluation ? 'success' : 'default'">Resume</v-chip>
                <v-chip size="x-small" :color="item.interviewEvaluation ? 'success' : 'default'">Interview</v-chip>
                <v-chip size="x-small" :color="item.projectLogReview ? 'success' : 'default'">Project</v-chip>
                <v-chip size="x-small" :color="item.codingSubmission ? 'success' : 'default'">Coding</v-chip>
              </div>
            </v-card-text>
            <v-card-actions>
              <v-btn
                variant="tonal"
                size="small"
                color="primary"
                :to="`/reports/${item.assignmentId}`"
              >
                View Complete Report
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>
