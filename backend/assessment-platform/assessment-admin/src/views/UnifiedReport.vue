<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { adminApi } from '../api';

const route = useRoute();
const assignmentId = route.params.id;

const report = ref(null);
const loading = ref(true);
const error = ref('');

const decision = ref('');
const privateNotes = ref('');
const submittingDecision = ref(false);
const decisionSuccess = ref('');

onMounted(loadReport);

async function loadReport() {
  loading.value = true;
  error.value = '';
  try {
    const data = await adminApi.getUnifiedReport(assignmentId);
    report.value = data;
    decision.value = data.overallStatus || 'PENDING_REVIEW';
    privateNotes.value = data.privateNotes || '';
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load unified assessment report.';
  } finally {
    loading.value = false;
  }
}

async function saveDecision() {
  submittingDecision.value = true;
  decisionSuccess.value = '';
  try {
    await adminApi.updateDecision(assignmentId, {
      decision: decision.value,
      privateNotes: privateNotes.value,
    });
    decisionSuccess.value = 'Decision updated successfully!';
    await loadReport();
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update decision.';
  } finally {
    submittingDecision.value = false;
  }
}

function statusColor(status) {
  return {
    APPROVED: 'success',
    REJECTED: 'error',
    RESUBMISSION_REQUESTED: 'warning',
    PENDING_REVIEW: 'info',
    COMPLETED: 'success',
  }[status] || 'default';
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Unified Assessment Report</h1>
        <div v-if="report" class="text-subtitle-2 text-medium-emphasis">
          {{ report.assignment.title }} — {{ report.assignment.intern?.name || 'Unassigned Intern' }}
        </div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" to="/">Back to Dashboard</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <div v-else-if="report">
      <!-- Admin Action Card -->
      <v-card variant="outlined" class="mb-6 border-primary pa-4">
        <v-card-title class="text-h6 font-weight-bold d-flex align-center justify-space-between pa-0 mb-3">
          <span>Admin Review & Decision</span>
          <v-chip :color="statusColor(report.overallStatus)" size="small" variant="flat">
            {{ report.overallStatus }}
          </v-chip>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-alert v-if="decisionSuccess" type="success" variant="tonal" class="mb-3">{{ decisionSuccess }}</v-alert>
          <v-row density="compact">
            <v-col cols="12" md="4">
              <v-select
                v-model="decision"
                label="Overall Decision"
                :items="[
                  { title: 'Approve', value: 'APPROVED' },
                  { title: 'Reject', value: 'REJECTED' },
                  { title: 'Request Resubmission', value: 'RESUBMISSION_REQUESTED' },
                  { title: 'Pending Review', value: 'PENDING_REVIEW' }
                ]"
                item-title="title"
                item-value="value"
                variant="outlined"
                density="compact"
              />
            </v-col>
            <v-col cols="12" md="8">
              <v-textarea
                v-model="privateNotes"
                label="Internal Admin Notes (Private)"
                rows="2"
                variant="outlined"
                density="compact"
                placeholder="Enter feedback or internal instructions..."
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="pa-0 justify-end">
          <v-btn color="primary" variant="flat" :loading="submittingDecision" @click="saveDecision">
            Save Admin Decision
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Stage 1: Resume Screening -->
      <v-card class="mb-6" variant="outlined">
        <v-card-item>
          <template #append>
            <v-chip size="small" :color="report.stages.resume.status === 'Done' ? 'success' : 'default'">
              {{ report.stages.resume.status || 'Not Completed' }}
            </v-chip>
          </template>
          <v-card-title class="text-h6 font-weight-bold">Stage 1: Resume Screening</v-card-title>
        </v-card-item>
        <v-card-text v-if="report.stages.resume.status !== 'NOT_COMPLETED'">
          <v-row density="compact" class="mb-4">
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Match Score</div>
              <div class="text-h6 font-weight-bold text-primary">{{ report.stages.resume.matchScore }}%</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Skills Score</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.resume.skillsScore }}%</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Experience Score</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.resume.expScore }}%</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Recommendation</div>
              <v-chip size="small" color="primary" variant="tonal">{{ report.stages.resume.recommendation }}</v-chip>
            </v-col>
          </v-row>
          <p v-if="report.stages.resume.explanation" class="text-body-2 mb-2">{{ report.stages.resume.explanation }}</p>
        </v-card-text>
        <v-card-text v-else class="text-medium-emphasis">Resume screening has not been completed for this assignment.</v-card-text>
      </v-card>

      <!-- Stage 2: Video/Voice Interview -->
      <v-card class="mb-6" variant="outlined">
        <v-card-item>
          <template #append>
            <v-chip size="small" :color="report.stages.interview.status === 'COMPLETED' ? 'success' : 'default'">
              {{ report.stages.interview.status || 'Not Completed' }}
            </v-chip>
          </template>
          <v-card-title class="text-h6 font-weight-bold">Stage 2: Video & Voice Interview</v-card-title>
        </v-card-item>
        <v-card-text v-if="report.stages.interview.status !== 'NOT_COMPLETED'">
          <v-row density="compact" class="mb-4">
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Interview Score</div>
              <div class="text-h6 font-weight-bold text-primary">{{ report.stages.interview.interviewScore }}/100</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Technical</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.interview.technicalScore }}/100</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Communication</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.interview.communicationScore }}/100</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Confidence</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.interview.confidenceScore }}/100</div>
            </v-col>
          </v-row>
          <p v-if="report.stages.interview.aiSummary" class="text-body-2 mb-2">{{ report.stages.interview.aiSummary }}</p>
        </v-card-text>
        <v-card-text v-else class="text-medium-emphasis">Video/Voice Interview has not been completed for this assignment.</v-card-text>
      </v-card>

      <!-- Stage 3: Project Analysis -->
      <v-card class="mb-6" variant="outlined">
        <v-card-item>
          <template #append>
            <v-chip size="small" :color="report.stages.project.recommendation === 'APPROVED' ? 'success' : 'default'">
              {{ report.stages.project.recommendation || 'Not Completed' }}
            </v-chip>
          </template>
          <v-card-title class="text-h6 font-weight-bold">Stage 3: Project Log Analysis (LogLense)</v-card-title>
        </v-card-item>
        <v-card-text v-if="report.stages.project.recommendation !== 'NOT_COMPLETED'">
          <v-row density="compact" class="mb-4">
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Overall Score</div>
              <div class="text-h6 font-weight-bold text-primary">{{ report.stages.project.overallScore }}/100</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Correctness</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.project.correctnessScore }}/100</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Code Quality</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.project.qualityScore }}/100</div>
            </v-col>
            <v-col cols="6" sm="3">
              <div class="text-caption text-medium-emphasis">Risk Level</div>
              <div class="text-subtitle-1 font-weight-bold">{{ report.stages.project.riskScore }}/100</div>
            </v-col>
          </v-row>
          <p v-if="report.stages.project.summary" class="text-body-2">{{ report.stages.project.summary }}</p>
        </v-card-text>
        <v-card-text v-else class="text-medium-emphasis">Project log review has not been completed for this assignment.</v-card-text>
      </v-card>

      <!-- Stage 4: Coding Assessment -->
      <v-card class="mb-6" variant="outlined">
        <v-card-item>
          <template #append>
            <v-chip size="small" :color="report.stages.coding.status === 'SUBMITTED' ? 'success' : 'default'">
              {{ report.stages.coding.status || 'Not Completed' }}
            </v-chip>
          </template>
          <v-card-title class="text-h6 font-weight-bold">Stage 4: Coding Assessment</v-card-title>
        </v-card-item>
        <v-card-text v-if="report.stages.coding.status !== 'NOT_COMPLETED'">
          <div class="d-flex align-center ga-4 mb-4">
            <div>
              <span class="text-caption text-medium-emphasis">Submitted Versions: </span>
              <span class="font-weight-bold">{{ report.stages.coding.versionCount }}</span>
            </div>
            <div>
              <span class="text-caption text-medium-emphasis">Language: </span>
              <span class="font-weight-bold">{{ report.assignment.language || 'Code' }}</span>
            </div>
          </div>
          <v-card v-if="report.stages.coding.currentVersion" variant="flat" color="grey-lighten-4" class="pa-3 font-monospace text-caption">
            <pre style="white-space: pre-wrap;">{{ report.stages.coding.currentVersion.sourceCode }}</pre>
          </v-card>
        </v-card-text>
        <v-card-text v-else class="text-medium-emphasis">Coding assessment solution has not been submitted yet.</v-card-text>
      </v-card>
    </div>
  </div>
</template>
