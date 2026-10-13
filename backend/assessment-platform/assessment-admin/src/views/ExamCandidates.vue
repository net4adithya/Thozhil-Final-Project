<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { examsApi, recordingsApi, submissionsApi } from '../api';
import { getSocket, joinExamRoom, leaveExamRoom } from '../api/socket';

const props = defineProps({ id: { type: String, required: true } });

const exam = ref(null);
const candidates = ref([]);
const submissionsByCandidate = ref({});
const loading = ref(true);
const downloadingXlsx = ref(false);
const downloadingPdf = ref(false);
const tab = ref('candidates');

const openRecordings = ref(null);
const recordings = ref([]);
const loadingRecordings = ref(false);

const STALE_MS = 25_000;
const now = ref(Date.now());
let recordingClockId = null;

// Question-level analysis
const questionAnalysis = ref([]);
const loadingAnalysis = ref(false);
const analysisLoaded = ref(false);

// Review & Grading dialog
const gradeDialog = ref(false);
const gradingCandidate = ref(null);
const gradingSubmission = ref(null);
const loadingSubmission = ref(false);
const savingAnswerFor = ref(null);
const gradeDraft = ref({}); // questionId -> { marksAwarded, feedback }

// Authority decision & Gemini review state
const authorityDecision = ref('pending');
const privateNotes = ref('');
const savingDecision = ref(false);
const runningGemini = ref(false);
const decisionNotice = ref('');

const headers = [
  { title: 'Candidate', key: 'name' },
  { title: 'Status', key: 'status' },
  { title: 'Authority Decision', key: 'authorityDecision', sortable: false },
  { title: 'Recording', key: 'recording', sortable: false },
  { title: 'Score', key: 'score', sortable: false },
  { title: 'Violations', key: 'violationCount', align: 'end' },
  { title: '', key: 'actions', align: 'end', sortable: false },
];

const analysisHeaders = [
  { title: 'Question', key: 'title' },
  { title: 'Type', key: 'type' },
  { title: 'Attempts', key: 'attempts', align: 'end' },
  { title: 'Pass rate', key: 'passRate', align: 'end' },
  { title: 'Avg marks', key: 'avgMarksAwarded', align: 'end' },
  { title: 'Needs grading', key: 'needsManualGrading', align: 'end' },
];

onMounted(async () => {
  await load();
  joinExamRoom(props.id);
  getSocket().on('candidate-update', onCandidateUpdate);
  recordingClockId = setInterval(() => (now.value = Date.now()), 5000);
});

onBeforeUnmount(() => {
  leaveExamRoom(props.id);
  getSocket().off('candidate-update', onCandidateUpdate);
  if (recordingClockId) clearInterval(recordingClockId);
});

function onCandidateUpdate(evt) {
  if (evt.examId !== props.id) return;
  const candidate = candidates.value.find((c) => c._id === evt.candidateId);
  if (!candidate) return;

  if (evt.kind === 'status' || evt.kind === 'progress' || evt.kind === 'submitted') {
    if (evt.status) candidate.status = evt.status;
  }
  if (evt.kind === 'violation') {
    candidate.violationCount = evt.violationCount;
  }
  if (evt.kind === 'recording') {
    candidate.recording = {
      webcamActive: evt.webcamActive,
      screenActive: evt.screenActive,
      lastHeartbeatAt: evt.lastHeartbeatAt,
    };
  }
  if (evt.kind === 'submitted' || evt.kind === 'graded') {
    const row = submissionsByCandidate.value[candidate.email];
    if (row && evt.totalMarksAwarded !== undefined) {
      row.marksAwarded = evt.totalMarksAwarded;
      row.percentage = row.marksPossible ? Math.round((evt.totalMarksAwarded / row.marksPossible) * 1000) / 10 : 0;
    }
  }
  if (['submitted', 'graded'].includes(evt.kind)) analysisLoaded.value = false;
}

async function load() {
  loading.value = true;
  try {
    const [examData, candidateList, report] = await Promise.all([
      examsApi.get(props.id),
      examsApi.listCandidates(props.id),
      examsApi.reportData(props.id),
    ]);
    exam.value = examData;
    candidates.value = candidateList;
    submissionsByCandidate.value = Object.fromEntries(report.rows.map((r) => [r.email, r]));
  } finally {
    loading.value = false;
  }
}

async function loadAnalysis() {
  loadingAnalysis.value = true;
  try {
    const res = await examsApi.questionAnalysis(props.id);
    questionAnalysis.value = res.questions;
    analysisLoaded.value = true;
  } finally {
    loadingAnalysis.value = false;
  }
}

function onTabChange(val) {
  if (val === 'analysis' && !analysisLoaded.value) loadAnalysis();
}

function scoreFor(candidate) {
  const row = submissionsByCandidate.value[candidate.email];
  if (!row || row.marksPossible === 0) return '—';
  return `${row.marksAwarded} / ${row.marksPossible} (${row.percentage}%)`;
}

function candidateDecisionFor(candidate) {
  const row = submissionsByCandidate.value[candidate.email];
  return row?.authorityDecision || candidate.authorityDecision || 'pending';
}

function decisionBadgeColor(dec) {
  switch (dec) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'resubmit_requested': return 'warning';
    default: return 'default';
  }
}

async function downloadXlsx() {
  downloadingXlsx.value = true;
  try {
    await examsApi.downloadReportXlsx(props.id, `${exam.value.title}-report.xlsx`);
  } finally {
    downloadingXlsx.value = false;
  }
}

async function downloadPdf() {
  downloadingPdf.value = true;
  try {
    await examsApi.downloadReportPdf(props.id, `${exam.value.title}-report.pdf`);
  } finally {
    downloadingPdf.value = false;
  }
}

async function toggleRecordings(candidateId) {
  if (openRecordings.value === candidateId) {
    openRecordings.value = null;
    return;
  }
  openRecordings.value = candidateId;
  loadingRecordings.value = true;
  recordings.value = await recordingsApi.listForCandidate(props.id, candidateId);
  loadingRecordings.value = false;
}

function statusColor(status) {
  return (
    {
      submitted: 'success',
      auto_submitted: 'warning',
      banned: 'error',
      blocked: 'error',
      terminated: 'error',
      in_progress: 'primary',
      started: 'primary',
      invited: 'default',
      expired: 'error',
    }[status] || 'default'
  );
}

function formatViolationType(type) {
  const map = {
    game_bar_shortcut: 'Game Bar (Alt+G / Win+G)',
    restricted_shortcut: 'DevTools (F12)',
    copy_paste: 'Copy / Paste',
    tab_hidden: 'Tab Switch',
    fullscreen_exit: 'Exited Fullscreen',
    devtools: 'DevTools Panel',
    webcam_denied: 'Webcam Disconnected',
    screen_share_stopped: 'Screen Share Stopped',
  };
  return map[type] || (type ? type.replace(/_/g, ' ') : 'Violation');
}

function recordingStatus(candidate) {
  const p = exam.value?.proctoring;
  const required = !!(p && (p.webcam || p.screenShare));
  if (!required || !['started', 'in_progress'].includes(candidate.status)) {
    return { text: '—', color: 'default' };
  }

  const rec = candidate.recording;
  if (!rec || !rec.lastHeartbeatAt) {
    return { text: 'Not started', color: 'default' };
  }

  const ageMs = now.value - new Date(rec.lastHeartbeatAt).getTime();
  if (ageMs > STALE_MS) {
    return { text: 'Stalled', color: 'warning' };
  }
  return { text: 'Active', color: 'success' };
}

async function openGrading(candidate) {
  gradingCandidate.value = candidate;
  gradeDialog.value = true;
  gradingSubmission.value = null;
  gradeDraft.value = {};
  loadingSubmission.value = true;
  try {
    const data = await submissionsApi.get(props.id, candidate._id);
    gradingSubmission.value = data;
    authorityDecision.value = data.submission?.authorityDecision || 'pending';
    privateNotes.value = data.submission?.privateNotes || '';
    for (const a of data.answers || []) {
      gradeDraft.value[a.question?._id] = { marksAwarded: a.marksAwarded, feedback: a.feedback || '' };
    }
  } finally {
    loadingSubmission.value = false;
  }
}

const codingAnswers = computed(() =>
  (gradingSubmission.value?.answers || []).filter((a) => a.type === 'coding')
);
const subjectiveAnswers = computed(() =>
  (gradingSubmission.value?.answers || []).filter((a) => ['subjective', 'file_upload'].includes(a.type))
);

async function recordDecision(newDecision) {
  if (!gradingCandidate.value) return;
  savingDecision.value = true;
  try {
    const res = await submissionsApi.decide(props.id, gradingCandidate.value._id, {
      decision: newDecision,
      privateNotes: privateNotes.value,
    });
    authorityDecision.value = res.decision;
    if (gradingSubmission.value?.submission) {
      gradingSubmission.value.submission.authorityDecision = res.decision;
      gradingSubmission.value.submission.privateNotes = res.privateNotes;
    }
    const row = submissionsByCandidate.value[gradingCandidate.value.email];
    if (row) row.authorityDecision = res.decision;
    gradingCandidate.value.authorityDecision = res.decision;

    decisionNotice.value = `Decision recorded as "${newDecision}"!`;
    setTimeout(() => (decisionNotice.value = ''), 3000);
  } catch (err) {
    alert(err.response?.data?.message || 'Could not save decision.');
  } finally {
    savingDecision.value = false;
  }
}

async function runGeminiReview() {
  if (!gradingCandidate.value) return;
  runningGemini.value = true;
  try {
    const res = await submissionsApi.reviewGemini(props.id, gradingCandidate.value._id);
    const refreshed = await submissionsApi.get(props.id, gradingCandidate.value._id);
    gradingSubmission.value = refreshed;
    decisionNotice.value = `Gemini AI evaluated ${res.reviewed || 0} coding answers!`;
    setTimeout(() => (decisionNotice.value = ''), 3000);
  } catch (err) {
    alert(err.response?.data?.message || 'Gemini review failed.');
  } finally {
    runningGemini.value = false;
  }
}

async function saveGrade(answer) {
  const questionId = answer.question?._id;
  if (!questionId) return;
  savingAnswerFor.value = questionId;
  try {
    const draft = gradeDraft.value[questionId];
    const res = await submissionsApi.grade(props.id, gradingCandidate.value._id, {
      questionId,
      marksAwarded: draft.marksAwarded,
      feedback: draft.feedback,
    });
    answer.marksAwarded = res.marksAwarded;
    answer.isCorrect = res.marksAwarded >= (answer.question.marks || 0);
    answer.gradedAt = new Date().toISOString();
    answer.needsManualGrading = false;
    if (gradingSubmission.value) gradingSubmission.value.submission.totalMarksAwarded = res.totalMarksAwarded;

    const row = submissionsByCandidate.value[gradingCandidate.value.email];
    if (row) {
      row.marksAwarded = res.totalMarksAwarded;
      row.percentage = row.marksPossible ? Math.round((res.totalMarksAwarded / row.marksPossible) * 1000) / 10 : 0;
    }
  } finally {
    savingAnswerFor.value = null;
  }
}

function downloadAnswerFile(answer) {
  if (!answer.question?._id) return;
  const name = answer.fileUrl ? answer.fileUrl.split('/').pop() : 'answer-file';
  submissionsApi.downloadAnswerFile(props.id, gradingCandidate.value._id, answer.question._id, name);
}
</script>

<template>
  <p v-if="loading" class="text-medium-emphasis">Loading…</p>

  <template v-else>
    <div class="d-flex align-start justify-space-between mb-4 flex-wrap ga-3">
      <div>
        <div class="d-flex align-center ga-2 mb-1">
          <h1 class="text-h5 font-weight-bold">{{ exam.title }}</h1>
          <v-chip v-if="exam.accessCode" size="small" color="primary" variant="flat" class="font-monospace font-weight-bold">
            Code: {{ exam.accessCode }}
          </v-chip>
        </div>
        <p class="text-caption text-medium-emphasis">{{ candidates.length }} candidate attempt(s) recorded</p>
      </div>
      <div class="d-flex ga-2">
        <v-btn variant="outlined" prepend-icon="mdi-file-excel-outline" :loading="downloadingXlsx" @click="downloadXlsx">
          Excel Report
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-file-pdf-box" :loading="downloadingPdf" @click="downloadPdf">
          PDF Report
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-pencil" :to="`/exams/${id}`">
          Edit Assessment
        </v-btn>
      </div>
    </div>

    <v-tabs v-model="tab" class="mb-4" @update:model-value="onTabChange">
      <v-tab value="candidates">Intern Submissions ({{ candidates.length }})</v-tab>
      <v-tab value="analysis">Question Analytics</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="candidates">
        <v-data-table :headers="headers" :items="candidates" item-value="_id" density="comfortable">
          <template #item.name="{ item }">
            <div class="font-weight-medium">{{ item.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
          </template>
          <template #item.status="{ item }">
            <v-chip size="small" :color="statusColor(item.status)" variant="tonal">
              {{ item.status.replace('_', ' ') }}
            </v-chip>
          </template>
          <template #item.authorityDecision="{ item }">
            <v-chip size="small" :color="decisionBadgeColor(candidateDecisionFor(item))" variant="flat" class="text-capitalize">
              {{ candidateDecisionFor(item).replace('_', ' ') }}
            </v-chip>
          </template>
          <template #item.recording="{ item }">
            <v-chip
              size="small"
              :color="recordingStatus(item).color"
              :variant="recordingStatus(item).text === '—' ? 'text' : 'tonal'"
            >
              {{ recordingStatus(item).text }}
            </v-chip>
          </template>
          <template #item.score="{ item }">{{ scoreFor(item) }}</template>
          <template #item.violationCount="{ item }">
            <div v-if="item.violationCount > 0 || item.violations?.length" class="d-flex flex-column align-end ga-1 py-1">
              <v-chip size="x-small" color="error" variant="flat" class="font-weight-bold">
                {{ item.violationCount || item.violations?.length || 0 }} Violation(s)
              </v-chip>
              <div class="d-flex ga-1 flex-wrap justify-end" style="max-width: 220px;">
                <v-chip
                  v-for="(v, idx) in item.violations || []"
                  :key="idx"
                  size="x-small"
                  color="error"
                  variant="tonal"
                  class="text-caption font-weight-medium"
                >
                  {{ formatViolationType(v.type) }}
                </v-chip>
              </div>
            </div>
            <span v-else class="text-medium-emphasis">—</span>
          </template>
          <template #item.actions="{ item }">
            <v-btn
              size="small"
              color="primary"
              variant="tonal"
              class="mr-2"
              @click="openGrading(item)"
            >
              Review & Decision
            </v-btn>
            <v-btn size="small" variant="text" @click="toggleRecordings(item._id)">
              {{ openRecordings === item._id ? 'Hide recordings' : 'Recordings' }}
            </v-btn>
          </template>
        </v-data-table>

        <v-card v-if="openRecordings" class="pa-4 mt-3" variant="tonal">
          <p v-if="loadingRecordings" class="text-medium-emphasis">Loading recordings…</p>
          <p v-else-if="recordings.length === 0" class="text-medium-emphasis">No recordings uploaded.</p>
          <div v-else class="d-flex flex-column ga-2">
            <div v-for="rec in recordings" :key="rec._id" class="d-flex align-center ga-4">
              <v-chip size="small" variant="tonal" class="text-capitalize">{{ rec.type }}</v-chip>
              <span class="text-caption text-medium-emphasis">{{ new Date(rec.startedAt).toLocaleTimeString() }}</span>
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-download"
                @click="recordingsApi.download(rec._id, `recording-${rec.type}-${rec._id}.webm`)"
              >
                Download
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-window-item>

      <v-window-item value="analysis">
        <v-progress-linear v-if="loadingAnalysis" indeterminate color="primary" class="mb-3" />
        <p class="text-caption text-medium-emphasis mb-3">
          Per-question performance metrics across all submitted intern sessions.
        </p>
        <v-data-table :headers="analysisHeaders" :items="questionAnalysis" item-value="questionId" density="comfortable">
          <template #item.type="{ item }">
            <v-chip size="small" variant="tonal">{{ item.type.replace('_', ' ') }}</v-chip>
          </template>
          <template #item.passRate="{ item }">
            <span v-if="item.passRate === null">—</span>
            <span v-else :class="item.passRate < 40 ? 'text-error' : item.passRate > 85 ? 'text-success' : ''">
              {{ item.passRate }}%
            </span>
          </template>
          <template #item.needsManualGrading="{ item }">
            <span v-if="item.needsManualGrading > 0" class="text-warning font-weight-medium">
              {{ item.needsManualGrading }}
            </span>
            <span v-else>—</span>
          </template>
        </v-data-table>
      </v-window-item>
    </v-window>

    <!-- Authority Review & Decision Dialog -->
    <v-dialog v-model="gradeDialog" max-width="960" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between pa-4">
          <div>
            <div class="text-h6 font-weight-bold">Submission Review: {{ gradingCandidate?.name }}</div>
            <div class="text-caption text-medium-emphasis">{{ gradingCandidate?.email }}</div>
          </div>
          <div v-if="gradingSubmission?.submission" class="d-flex align-center ga-3">
            <v-chip size="default" :color="decisionBadgeColor(authorityDecision)" variant="flat" class="text-capitalize font-weight-bold">
              {{ authorityDecision.replace('_', ' ') }}
            </v-chip>
            <span class="text-subtitle-2 font-weight-bold">
              Score: {{ gradingSubmission.submission.totalMarksAwarded }} / {{ gradingSubmission.submission.totalMarksPossible }}
            </span>
          </div>
        </v-card-title>
        <v-divider />

        <v-card-text style="max-height: 75vh" class="pa-4">
          <p v-if="loadingSubmission" class="text-medium-emphasis">Loading submission details…</p>
          <template v-else-if="gradingSubmission">
            <!-- Proctoring Security Violations Breakdown -->
            <v-card
              v-if="gradingCandidate?.violations?.length || gradingSubmission?.candidate?.violations?.length || ['banned', 'blocked', 'terminated'].includes(gradingCandidate?.status)"
              variant="tonal"
              color="error"
              class="pa-4 mb-4 rounded border"
            >
              <div class="d-flex align-center justify-space-between mb-2 flex-wrap ga-2">
                <div class="d-flex align-center ga-2">
                  <v-icon icon="mdi-shield-alert" color="error" size="large" />
                  <div>
                    <div class="text-subtitle-1 font-weight-bold text-error">
                      Proctoring Violations Logged ({{ gradingCandidate?.violationCount || gradingCandidate?.violations?.length || 0 }})
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      Security & anti-cheat events captured during assessment session.
                    </div>
                  </div>
                </div>
                <v-chip
                  v-if="['banned', 'blocked', 'terminated'].includes(gradingCandidate?.status)"
                  size="default"
                  color="error"
                  variant="flat"
                  class="font-weight-bold text-uppercase"
                >
                  ⛔ Candidate Banned
                </v-chip>
              </div>

              <div class="d-flex flex-column ga-2 mt-3">
                <div
                  v-for="(v, idx) in (gradingCandidate?.violations || gradingSubmission?.candidate?.violations || [])"
                  :key="idx"
                  class="d-flex align-center justify-space-between bg-surface pa-3 rounded border"
                  style="border-color: rgba(239, 68, 68, 0.2);"
                >
                  <div class="d-flex align-center ga-2">
                    <v-chip size="x-small" color="error" variant="flat" class="font-weight-bold">
                      #{{ idx + 1 }}
                    </v-chip>
                    <span class="text-body-2 font-weight-bold text-error">
                      {{ formatViolationType(v.type) }}
                    </span>
                  </div>
                  <span class="text-caption text-medium-emphasis">
                    Recorded at {{ new Date(v.occurredAt || Date.now()).toLocaleTimeString() }}
                  </span>
                </div>
              </div>
            </v-card>

            <!-- Authority Decision Panel -->
            <v-card variant="outlined" class="pa-4 mb-5 border-primary">
              <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
                <div class="text-subtitle-1 font-weight-bold">Authority Final Decision</div>
                <v-btn
                  color="purple-darken-1"
                  variant="tonal"
                  size="small"
                  prepend-icon="mdi-creation"
                  :loading="runningGemini"
                  @click="runGeminiReview"
                >
                  Run Gemini Code Review
                </v-btn>
              </div>

              <div class="d-flex ga-2 mb-3 flex-wrap">
                <v-btn
                  color="success"
                  :variant="authorityDecision === 'approved' ? 'flat' : 'outlined'"
                  prepend-icon="mdi-check-circle"
                  :loading="savingDecision"
                  @click="recordDecision('approved')"
                >
                  Approve Candidate
                </v-btn>
                <v-btn
                  color="error"
                  :variant="authorityDecision === 'rejected' ? 'flat' : 'outlined'"
                  prepend-icon="mdi-close-circle"
                  :loading="savingDecision"
                  @click="recordDecision('rejected')"
                >
                  Reject Candidate
                </v-btn>
                <v-btn
                  color="warning"
                  :variant="authorityDecision === 'resubmit_requested' ? 'flat' : 'outlined'"
                  prepend-icon="mdi-refresh"
                  :loading="savingDecision"
                  @click="recordDecision('resubmit_requested')"
                >
                  Request Resubmit
                </v-btn>
              </div>

              <v-textarea
                v-model="privateNotes"
                label="Authority Evaluation Notes (Private)"
                rows="2"
                placeholder="Add evaluation summary, hiring recommendation, or specific feedback..."
                hide-details
                density="comfortable"
                class="mb-2"
              />
              <div class="d-flex justify-end">
                <v-btn
                  size="small"
                  variant="tonal"
                  color="primary"
                  :loading="savingDecision"
                  @click="recordDecision(authorityDecision)"
                >
                  Save Notes
                </v-btn>
              </div>
              <v-alert v-if="decisionNotice" type="success" variant="tonal" density="compact" class="mt-2">
                {{ decisionNotice }}
              </v-alert>
            </v-card>

            <!-- Coding Answers Breakdown -->
            <div class="text-subtitle-1 font-weight-bold mb-3">Coding Solutions</div>
            <div v-if="codingAnswers.length === 0" class="text-medium-emphasis mb-4">
              No coding answers submitted in this attempt.
            </div>

            <v-card
              v-for="answer in codingAnswers"
              :key="answer.question?._id"
              variant="outlined"
              class="pa-4 mb-4"
            >
              <div class="d-flex justify-space-between align-start mb-2 flex-wrap ga-2">
                <div>
                  <div class="text-h6 font-weight-bold">{{ answer.question?.title }}</div>
                  <div class="text-caption text-medium-emphasis">
                    Language: <span class="font-weight-bold text-uppercase">{{ answer.language }}</span> ·
                    Passed: {{ answer.passedCount || 0 }} / {{ answer.totalCount || 0 }} test cases
                  </div>
                </div>
                <v-chip
                  size="small"
                  :color="answer.passedCount === answer.totalCount && answer.totalCount > 0 ? 'success' : answer.passedCount > 0 ? 'warning' : 'error'"
                  variant="flat"
                >
                  {{ answer.marksAwarded }} / {{ answer.question?.marks }} marks
                </v-chip>
              </div>

              <p class="text-body-2 text-medium-emphasis mb-3">{{ answer.question?.statement }}</p>

              <!-- Test Case Execution Breakdown -->
              <div v-if="answer.testCaseResults?.length" class="mb-4">
                <div class="text-caption font-weight-bold text-medium-emphasis mb-2">Test Case Execution Breakdown:</div>
                <div
                  v-for="(tc, i) in answer.testCaseResults"
                  :key="tc.testCaseId || i"
                  class="pa-3 mb-2 rounded border"
                  :style="{ borderColor: tc.passed ? '#22c55e' : '#ef4444', backgroundColor: tc.passed ? '#f0fdf4' : '#fef2f2' }"
                >
                  <div class="d-flex align-center justify-space-between mb-1">
                    <span class="font-weight-bold" :style="{ color: tc.passed ? '#15803d' : '#b91c1c' }">
                      Case {{ i + 1 }}: {{ tc.passed ? 'PASSED' : 'FAILED' }}
                    </span>
                    <v-chip size="x-small" :color="tc.passed ? 'success' : 'error'" variant="flat">
                      {{ tc.passed ? 'PASSED' : 'FAILED' }}
                    </v-chip>
                  </div>
                  <div class="text-caption font-monospace" style="line-height: 1.6; color: #1e293b;">
                    <div><strong>Input:</strong> <code>{{ tc.input !== undefined && tc.input !== null ? tc.input : 'N/A' }}</code></div>
                    <div><strong>Expected Output:</strong> <code>{{ tc.expectedOutput !== undefined && tc.expectedOutput !== null ? tc.expectedOutput : 'N/A' }}</code></div>
                    <div><strong>Actual Output:</strong> <code>{{ tc.actualOutput !== undefined && tc.actualOutput !== null ? tc.actualOutput : (tc.stdout || tc.stderr || 'No output') }}</code></div>
                  </div>
                </div>
              </div>

              <!-- Intern Code Box -->
              <div class="text-caption text-medium-emphasis mb-1">Submitted Code:</div>
              <pre class="code-box mb-3">{{ answer.code || '// No code submitted' }}</pre>

              <!-- Gemini AI Code Review Card -->
              <v-card v-if="answer.geminiReview" variant="tonal" color="purple-darken-3" class="pa-4 rounded border">
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-icon icon="mdi-creation" color="purple-lighten-2" />
                    <span class="font-weight-bold">Gemini AI Code Review</span>
                  </div>
                  <v-chip v-if="answer.geminiReview.score !== undefined" size="small" color="purple-lighten-2" variant="flat">
                    AI Score: {{ answer.geminiReview.score }} / 100
                  </v-chip>
                </div>

                <p v-if="answer.geminiReview.summary" class="text-body-2 mb-2 font-italic">
                  "{{ answer.geminiReview.summary }}"
                </p>

                <div v-if="answer.geminiReview.strengths?.length" class="mb-2">
                  <div class="text-caption font-weight-bold text-success">Strengths:</div>
                  <ul class="pl-4 text-caption">
                    <li v-for="(s, idx) in answer.geminiReview.strengths" :key="idx">{{ s }}</li>
                  </ul>
                </div>

                <div v-if="answer.geminiReview.improvements?.length" class="mb-2">
                  <div class="text-caption font-weight-bold text-warning">Improvements:</div>
                  <ul class="pl-4 text-caption">
                    <li v-for="(imp, idx) in answer.geminiReview.improvements" :key="idx">{{ imp }}</li>
                  </ul>
                </div>

                <div v-if="answer.geminiReview.complexity" class="text-caption text-medium-emphasis">
                  <strong>Complexity:</strong> Time: {{ answer.geminiReview.complexity.time || 'N/A' }} | Space: {{ answer.geminiReview.complexity.space || 'N/A' }}
                </div>
              </v-card>
            </v-card>

            <!-- Subjective / File Upload Questions -->
            <div v-if="subjectiveAnswers.length > 0" class="mt-4">
              <div class="text-subtitle-1 font-weight-bold mb-3">Manual Graded Questions</div>
              <v-card
                v-for="answer in subjectiveAnswers"
                :key="answer.question?._id"
                variant="outlined"
                class="pa-4 mb-4"
              >
                <div class="d-flex justify-space-between align-start mb-2">
                  <div class="font-weight-medium">{{ answer.question?.title }}</div>
                  <v-chip size="small" :color="answer.needsManualGrading ? 'warning' : 'success'" variant="tonal">
                    {{ answer.needsManualGrading ? 'Needs grading' : 'Graded' }}
                  </v-chip>
                </div>
                <p class="text-body-2 text-medium-emphasis mb-2">{{ answer.question?.statement }}</p>

                <div class="mb-3">
                  <div class="text-caption text-medium-emphasis">Candidate's answer</div>
                  <div v-if="answer.type === 'subjective'" class="text-body-2" style="white-space: pre-wrap">
                    {{ answer.textAnswer || '(no answer submitted)' }}
                  </div>
                  <v-btn
                    v-else
                    size="small"
                    variant="tonal"
                    prepend-icon="mdi-download"
                    :disabled="!answer.fileUrl"
                    @click="downloadAnswerFile(answer)"
                  >
                    {{ answer.fileUrl ? 'Download submitted file' : 'No file submitted' }}
                  </v-btn>
                </div>

                <div class="d-flex ga-3 align-start flex-wrap">
                  <v-text-field
                    v-model.number="gradeDraft[answer.question?._id].marksAwarded"
                    type="number"
                    min="0"
                    :max="answer.question?.marks"
                    :label="`Marks (max ${answer.question?.marks})`"
                    style="max-width: 160px"
                    density="compact"
                    hide-details
                  />
                  <v-text-field
                    v-model="gradeDraft[answer.question?._id].feedback"
                    label="Feedback"
                    density="compact"
                    hide-details
                    class="flex-grow-1"
                  />
                  <v-btn
                    color="primary"
                    :loading="savingAnswerFor === answer.question?._id"
                    @click="saveGrade(answer)"
                  >
                    Save Grade
                  </v-btn>
                </div>
              </v-card>
            </div>
          </template>
        </v-card-text>

        <v-divider />
        <v-card-actions class="pa-3">
          <v-spacer />
          <v-btn variant="text" @click="gradeDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
</template>

<style scoped>
.code-box {
  background: #111827;
  color: #38bdf8;
  padding: 14px;
  border-radius: 6px;
  font-family: 'Fira Code', 'Courier New', monospace;
  font-size: 0.85rem;
  line-height: 1.5;
  overflow-x: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-height: 320px;
}
</style>
