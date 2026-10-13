<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api';

const router = useRouter();

const stats = ref({
  totalInterns: 0,
  activeAssignments: 0,
  pendingAssessments: 0,
  completedAssessments: 0,
  pendingReviews: 0,
  approved: 0,
  rejected: 0,
  resubmissionRequested: 0,
});

const pipelineOverview = ref([]);
const assignmentsList = ref([]);
const internsList = ref([]);
const loading = ref(true);
const error = ref('');

// Filters & Search
const search = ref('');
const statusFilter = ref('');

onMounted(loadDashboard);

async function loadDashboard() {
  loading.value = true;
  error.value = '';
  try {
    const [dashData, assignData, internsData] = await Promise.all([
      adminApi.getDashboardStats().catch(() => ({ overview: {}, pipelineOverview: [] })),
      adminApi.listAssignments().catch(() => []),
      adminApi.listInterns().catch(() => []),
    ]);

    if (dashData.overview) {
      stats.value = { ...stats.value, ...dashData.overview };
    }
    pipelineOverview.value = dashData.pipelineOverview || [];
    assignmentsList.value = assignData || [];
    internsList.value = internsData || [];
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not load admin dashboard.';
  } finally {
    loading.value = false;
  }
}

const filteredAssignments = computed(() => {
  return assignmentsList.value.filter((a) => {
    const matchesSearch =
      !search.value ||
      a.title.toLowerCase().includes(search.value.toLowerCase()) ||
      (a.intern?.name && a.intern.name.toLowerCase().includes(search.value.toLowerCase()));
    const matchesStatus = !statusFilter.value || a.status === statusFilter.value;
    return matchesSearch && matchesStatus;
  });
});

const pendingActionsList = computed(() => {
  return assignmentsList.value.filter((a) => ['PENDING_REVIEW', 'DRAFT', 'PUBLISHED'].includes(a.status));
});

const recentActivityList = computed(() => {
  return assignmentsList.value.slice(0, 5);
});

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

function openReport(assignmentId) {
  router.push(`/reports/${assignmentId}`);
}

function openInternHistory(internId) {
  router.push(`/interns/${internId}/history`);
}

function openModule(path) {
  router.push(path);
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Unified Admin Dashboard</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Overview of Intern pipeline, active multi-stage modules, and pending admin decisions</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/exams/new">Create Assignment</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert v-else-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

    <!-- Overview Statistics Cards (8 metrics) -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Total Interns</div>
          <div class="text-h4 font-weight-bold text-primary">{{ stats.totalInterns }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Active Assignments</div>
          <div class="text-h4 font-weight-bold text-info">{{ stats.activeAssignments }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Pending Assessments</div>
          <div class="text-h4 font-weight-bold text-warning">{{ stats.pendingAssessments }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Completed</div>
          <div class="text-h4 font-weight-bold text-success">{{ stats.completedAssessments }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Pending Reviews</div>
          <div class="text-h5 font-weight-bold text-warning">{{ stats.pendingReviews }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Approved</div>
          <div class="text-h5 font-weight-bold text-success">{{ stats.approved }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Rejected</div>
          <div class="text-h5 font-weight-bold text-error">{{ stats.rejected }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" sm="3">
        <v-card variant="outlined" class="pa-3 text-center">
          <div class="text-caption text-medium-emphasis">Resubmit Requested</div>
          <div class="text-h5 font-weight-bold text-deep-orange">{{ stats.resubmissionRequested }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Access to 4 Assessment Modules -->
    <v-row class="mb-6">
      <v-col cols="12">
        <div class="text-subtitle-1 font-weight-bold mb-2">Assessment Modules</div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card hover variant="outlined" class="pa-3" @click="openModule('/resume')">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-icon color="primary" size="large">mdi-file-document-search-outline</v-icon>
            <v-icon size="small" color="medium-emphasis">mdi-arrow-right</v-icon>
          </div>
          <div class="text-subtitle-2 font-weight-bold">AI Resume Screener</div>
          <div class="text-caption text-medium-emphasis">Screen resumes & TF-IDF match</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card hover variant="outlined" class="pa-3" @click="openModule('/interview')">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-icon color="info" size="large">mdi-video-account</v-icon>
            <v-icon size="small" color="medium-emphasis">mdi-arrow-right</v-icon>
          </div>
          <div class="text-subtitle-2 font-weight-bold">AI Video Interviewer</div>
          <div class="text-caption text-medium-emphasis">Voice turn-taking & proctoring</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card hover variant="outlined" class="pa-3" @click="openModule('/project-analysis')">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-icon color="warning" size="large">mdi-chart-timeline-variant</v-icon>
            <v-icon size="small" color="medium-emphasis">mdi-arrow-right</v-icon>
          </div>
          <div class="text-subtitle-2 font-weight-bold">AI Project Analyser</div>
          <div class="text-caption text-medium-emphasis">LogLense project & risk review</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card hover variant="outlined" class="pa-3" @click="openModule('/coding')">
          <div class="d-flex align-center justify-space-between mb-2">
            <v-icon color="success" size="large">mdi-code-braces</v-icon>
            <v-icon size="small" color="medium-emphasis">mdi-arrow-right</v-icon>
          </div>
          <div class="text-subtitle-2 font-weight-bold">AI Coding Interviewer</div>
          <div class="text-caption text-medium-emphasis">Monaco IDE & AST analysis</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters & Search Toolbar -->
    <v-card variant="outlined" class="pa-4 mb-6">
      <v-row density="compact" align="center">
        <v-col cols="12" sm="6" md="4">
          <v-text-field
            v-model="search"
            label="Search by title or intern name..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="statusFilter"
            label="Filter by Status"
            :items="[
              { title: 'All Statuses', value: '' },
              { title: 'Approved', value: 'APPROVED' },
              { title: 'Rejected', value: 'REJECTED' },
              { title: 'Resubmission Requested', value: 'RESUBMISSION_REQUESTED' },
              { title: 'Pending Review', value: 'PENDING_REVIEW' },
              { title: 'Draft', value: 'DRAFT' },
              { title: 'Published', value: 'PUBLISHED' }
            ]"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Intern Performance & Assessment Pipeline Table -->
    <v-card variant="outlined" class="mb-6 pa-4">
      <v-card-title class="text-h6 font-weight-bold mb-3 pa-0">
        Intern Performance & Assessment Pipeline
      </v-card-title>

      <v-table hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Assignment</th>
            <th class="text-left">Assigned Intern</th>
            <th class="text-left">Stage Breakdown (Resume → Interview → Project → Coding)</th>
            <th class="text-left">Status</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredAssignments.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-4">No assignments found matching criteria.</td>
          </tr>
          <tr v-for="item in filteredAssignments" :key="item.id">
            <td class="font-weight-medium">
              <div>{{ item.title }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.language }}</div>
            </td>
            <td>
              <div v-if="item.intern">
                <a class="text-primary text-decoration-none font-weight-medium cursor-pointer" @click="openInternHistory(item.intern.id)">
                  {{ item.intern.name }}
                </a>
                <div class="text-caption text-medium-emphasis">{{ item.intern.email }}</div>
              </div>
              <span v-else class="text-medium-emphasis">Unassigned</span>
            </td>
            <td>
              <div class="d-flex ga-1 flex-wrap">
                <v-chip size="x-small" :color="item.stages.resumeCount > 0 ? 'success' : 'grey'">Resume</v-chip>
                <v-chip size="x-small" :color="item.stages.interviewCount > 0 ? 'success' : 'grey'">Interview</v-chip>
                <v-chip size="x-small" :color="item.stages.projectLogCount > 0 ? 'success' : 'grey'">Project</v-chip>
                <v-chip size="x-small" :color="item.stages.submissionCount > 0 ? 'success' : 'grey'">Coding</v-chip>
              </div>
            </td>
            <td>
              <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
                {{ item.status }}
              </v-chip>
            </td>
            <td class="text-right">
              <v-btn
                size="small"
                variant="tonal"
                color="primary"
                @click="openReport(item.id)"
              >
                View Report
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <!-- Pending Admin Actions -->
    <v-card variant="outlined" class="pa-4">
      <v-card-title class="text-h6 font-weight-bold mb-3 pa-0">
        Pending Admin Actions ({{ pendingActionsList.length }})
      </v-card-title>
      <v-alert v-if="pendingActionsList.length === 0" type="success" variant="tonal">
        All candidate assessments have been reviewed and decided!
      </v-alert>
      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Assignment</th>
            <th class="text-left">Intern</th>
            <th class="text-left">Current Status</th>
            <th class="text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in pendingActionsList" :key="item.id">
            <td class="font-weight-medium">{{ item.title }}</td>
            <td>{{ item.intern?.name || 'Unassigned' }}</td>
            <td>
              <v-chip size="small" color="warning" variant="flat">{{ item.status }}</v-chip>
            </td>
            <td class="text-right">
              <v-btn size="small" color="primary" variant="flat" @click="openReport(item.id)">
                Review & Decide
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
