<script setup>
import { ref, onMounted } from 'vue';
import { adminApi, resumeApi } from '../api';

const assignments = ref([]);
const selectedAssignment = ref(null);
const candidateName = ref('');
const candidateEmail = ref('');
const jobTitle = ref('Software Engineer');
const jobDesc = ref('');
const reqSkills = ref('Python, REST APIs, SQL');
const prefSkills = ref('Docker, AWS');
const resumeText = ref('');
const resumeFile = ref(null);

const evaluations = ref([]);
const loading = ref(false);
const screening = ref(false);
const error = ref('');
const successMsg = ref('');

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
  try {
    const assignId = selectedAssignment.value;
    if (assignId) {
      const data = await resumeApi.getByAssignment(assignId);
      evaluations.value = data.evaluations || [];
    } else {
      const all = await adminApi.listAssignments();
      let accumulated = [];
      for (const a of all) {
        const d = await resumeApi.getByAssignment(a.id);
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

async function handleScreen() {
  if (!resumeText.value && !resumeFile.value) {
    error.value = 'Please provide resume text or upload a document.';
    return;
  }
  screening.value = true;
  error.value = '';
  successMsg.value = '';
  try {
    let uploadedFilename = '';
    if (resumeFile.value) {
      const formData = new FormData();
      formData.append('resumes', resumeFile.value);
      const upRes = await resumeApi.upload(formData);
      if (upRes.files && upRes.files.length > 0) {
        uploadedFilename = upRes.files[0].filename;
      }
    }

    const payload = {
      assignmentId: selectedAssignment.value || null,
      filename: uploadedFilename || 'candidate_resume.pdf',
      jobTitle: jobTitle.value,
      jobDesc: jobDesc.value,
      reqSkills: reqSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      prefSkills: prefSkills.value.split(',').map(s => s.trim()).filter(Boolean),
      resumeText: resumeText.value,
    };

    const res = await resumeApi.screen(payload);
    successMsg.value = `Candidate screened successfully! Overall Match: ${res.evaluation.matchScore || res.evaluation.match}%`;
    await fetchEvaluations();
  } catch (err) {
    error.value = err.response?.data?.message || 'Screening failed.';
  } finally {
    screening.value = false;
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
          <router-link to="/" class="text-decoration-none text-primary font-weight-medium">Dashboard</router-link> / AI Resume Screener
        </div>
        <h1 class="text-h5 font-weight-bold">AI Resume Screener</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Screen and analyse Intern resumes with TF-IDF taxonomy and Gemini AI</div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" to="/">Back to Dashboard</v-btn>
    </div>

    <!-- Screening Form Card -->
    <v-card variant="outlined" class="mb-6 pa-4">
      <v-card-title class="text-h6 font-weight-bold mb-3 pa-0">
        Run Resume AI Evaluation
      </v-card-title>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>
      <v-alert v-if="successMsg" type="success" variant="tonal" class="mb-3">{{ successMsg }}</v-alert>

      <v-row density="compact">
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedAssignment"
            label="Target Assignment (Optional)"
            :items="assignments"
            item-title="title"
            item-value="id"
            variant="outlined"
            density="compact"
            clearable
            @update:model-value="fetchEvaluations"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="jobTitle"
            label="Job Title / Designation"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="reqSkills"
            label="Required Skills (Comma-separated)"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="prefSkills"
            label="Preferred Skills (Comma-separated)"
            variant="outlined"
            density="compact"
          />
        </v-col>
        <v-col cols="12">
          <v-file-input
            v-model="resumeFile"
            label="Upload Candidate Resume File (PDF/DOCX/TXT)"
            variant="outlined"
            density="compact"
            prepend-icon="mdi-paperclip"
          />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="resumeText"
            label="Or Paste Resume Text / Summary"
            rows="3"
            variant="outlined"
            density="compact"
          />
        </v-col>
      </v-row>
      <div class="d-flex justify-end mt-2">
        <v-btn color="primary" variant="flat" prepend-icon="mdi-account-search-outline" :loading="screening" @click="handleScreen">
          Start AI Screening
        </v-btn>
      </div>
    </v-card>

    <!-- Evaluation Results Table -->
    <v-card variant="outlined" class="pa-4">
      <v-card-title class="text-h6 font-weight-bold mb-3 pa-0 d-flex align-center justify-space-between">
        <span>Screened Candidates ({{ evaluations.length }})</span>
        <v-btn size="small" variant="text" icon="mdi-refresh" @click="fetchEvaluations" />
      </v-card-title>

      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />

      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Candidate Name</th>
            <th class="text-left">Match Score</th>
            <th class="text-left">Recommendation</th>
            <th class="text-left">Matched Skills</th>
            <th class="text-left">Strengths / Gaps</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="evaluations.length === 0">
            <td colspan="5" class="text-center text-medium-emphasis py-4">No candidate resume evaluations found.</td>
          </tr>
          <tr v-for="ev in evaluations" :key="ev.id">
            <td class="font-weight-medium">
              <div>{{ ev.candidateName || 'Candidate' }}</div>
              <div class="text-caption text-medium-emphasis">{{ ev.candidateEmail }}</div>
            </td>
            <td>
              <div class="text-h6 font-weight-bold text-primary">{{ ev.matchScore }}%</div>
            </td>
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
              <div class="d-flex ga-1 flex-wrap">
                <v-chip
                  v-for="(s, i) in parseJsonArray(ev.matchedSkills)"
                  :key="i"
                  size="x-small"
                  color="success"
                  variant="tonal"
                >
                  {{ s }}
                </v-chip>
              </div>
            </td>
            <td>
              <div class="text-caption font-weight-medium text-success" v-if="parseJsonArray(ev.strengths).length">
                + {{ parseJsonArray(ev.strengths)[0] }}
              </div>
              <div class="text-caption text-error" v-if="parseJsonArray(ev.gaps).length">
                - {{ parseJsonArray(ev.gaps)[0] }}
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
