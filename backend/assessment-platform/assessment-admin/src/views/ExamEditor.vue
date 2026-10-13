<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { examsApi, questionsApi, questionBanksApi } from '../api';

const props = defineProps({ id: { type: String, default: null } });
const router = useRouter();
const isEdit = computed(() => !!props.id);

const loading = ref(isEdit.value);
const saving = ref(false);
const error = ref('');
const copiedNotice = ref('');

const statusOptions = [
  { title: 'Draft', value: 'draft' },
  { title: 'Active / Published', value: 'active' },
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'Closed', value: 'closed' },
];

const difficultyOptions = [
  { title: 'All Difficulties', value: 'all' },
  { title: 'Easy', value: 'easy' },
  { title: 'Medium', value: 'medium' },
  { title: 'Hard', value: 'hard' },
];

const form = reactive({
  title: '',
  description: '',
  durationMinutes: 60,
  startsAt: '',
  endsAt: '',
  negativeMarking: false,
  status: 'active',
  accessCode: '',
  proctoring: { webcam: false, screenShare: false, fullscreenRequired: false, maxViolations: 3 },
});

const attachedQuestions = ref([]); // full question objects, for display
const attachedIds = computed(() => new Set(attachedQuestions.value.map((q) => q._id)));

// Question Banks integration
const questionBanks = ref([]);
const selectedBankId = ref(null);
const selectedDifficulty = ref('all');
const loadingBanks = ref(false);

const currentBank = computed(() => {
  return questionBanks.value.find((b) => b._id === selectedBankId.value);
});

const filteredBankQuestions = computed(() => {
  if (!currentBank.value) return [];
  const list = currentBank.value.questions || [];
  if (selectedDifficulty.value === 'all') return list;
  return list.filter((q) => q.difficulty === selectedDifficulty.value);
});

const questionSearch = ref('');
const searchResults = ref([]);
let searchTimer;

onMounted(async () => {
  loadingBanks.value = true;
  try {
    const banks = await questionBanksApi.list();
    questionBanks.value = banks;
    if (banks.length > 0 && !selectedBankId.value) {
      selectedBankId.value = banks[0]._id;
    }
  } catch (err) {
    console.error('Failed to load question banks:', err);
  } finally {
    loadingBanks.value = false;
  }

  if (isEdit.value) {
    try {
      const exam = await examsApi.get(props.id);
      Object.assign(form, {
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        startsAt: exam.startsAt ? toLocalInput(exam.startsAt) : '',
        endsAt: exam.endsAt ? toLocalInput(exam.endsAt) : '',
        negativeMarking: exam.negativeMarking,
        status: exam.status,
        accessCode: exam.accessCode || '',
        proctoring: exam.proctoring || form.proctoring,
      });
      attachedQuestions.value = exam.questions || [];
    } catch (err) {
      error.value = err.response?.data?.message || 'Could not load the exam.';
    } finally {
      loading.value = false;
    }
  }
});

function toLocalInput(dateStr) {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function searchQuestions() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const res = await questionsApi.list({ search: questionSearch.value, limit: 10 });
    searchResults.value = res.items;
  }, 250);
}

function addQuestion(q) {
  if (!attachedIds.value.has(q._id)) attachedQuestions.value.push(q);
}

function removeQuestion(id) {
  attachedQuestions.value = attachedQuestions.value.filter((q) => q._id !== id);
}

function toggleQuestion(q) {
  if (attachedIds.value.has(q._id)) {
    removeQuestion(q._id);
  } else {
    addQuestion(q);
  }
}

function selectAllFromBank() {
  for (const q of filteredBankQuestions.value) {
    if (!attachedIds.value.has(q._id)) {
      attachedQuestions.value.push(q);
    }
  }
}

function clearAllFromBank() {
  const bankQIds = new Set(filteredBankQuestions.value.map((q) => q._id));
  attachedQuestions.value = attachedQuestions.value.filter((q) => !bankQIds.has(q._id));
}

const totalMarks = computed(() => attachedQuestions.value.reduce((s, q) => s + (q.marks || 0), 0));

const candidateBase = computed(() => {
  return import.meta.env.VITE_CANDIDATE_APP_URL || 'http://localhost:5173';
});

const candidateExamUrl = computed(() => {
  const code = form.accessCode;
  if (!code) return '';
  return `${candidateBase.value.replace(/\/$/, '')}/exam/${code}`;
});

function copyToClipboard(text, label) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  copiedNotice.value = `${label} copied to clipboard!`;
  setTimeout(() => (copiedNotice.value = ''), 3000);
}

function openCandidatePortal() {
  if (candidateExamUrl.value) {
    window.open(candidateExamUrl.value, '_blank');
  }
}

async function save(publishNow = false) {
  if (!form.title.trim()) {
    error.value = 'Please provide an assessment title.';
    return;
  }
  if (attachedQuestions.value.length === 0) {
    error.value = 'Please attach at least one question to the assessment.';
    return;
  }

  saving.value = true;
  error.value = '';
  try {
    const payload = {
      title: form.title,
      description: form.description,
      durationMinutes: Number(form.durationMinutes),
      startsAt: form.startsAt || null,
      endsAt: form.endsAt || null,
      negativeMarking: form.negativeMarking,
      status: publishNow ? 'active' : form.status,
      proctoring: {
        ...form.proctoring,
        maxViolations: Number(form.proctoring.maxViolations),
      },
    };

    let examId = props.id;
    if (isEdit.value) {
      const updated = await examsApi.update(examId, payload);
      form.accessCode = updated.accessCode;
      form.status = updated.status;
    } else {
      const created = await examsApi.create(payload);
      examId = created._id;
      form.accessCode = created.accessCode;
      form.status = created.status;
    }

    await examsApi.attachQuestions(examId, attachedQuestions.value.map((q) => q._id));

    if (!isEdit.value) {
      router.push(`/exams/${examId}`);
    } else {
      copiedNotice.value = 'Assessment saved successfully!';
      setTimeout(() => (copiedNotice.value = ''), 3000);
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not save the exam.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-3">
    <div>
      <h1 class="text-h5 font-weight-bold">{{ isEdit ? 'Edit Assessment' : 'Create Assessment' }}</h1>
      <p class="text-caption text-medium-emphasis">Configure question bank, duration, and access credentials</p>
    </div>
    <div class="d-flex ga-2">
      <v-btn v-if="isEdit" variant="outlined" prepend-icon="mdi-account-group" :to="`/exams/${id}/candidates`">
        View Submissions
      </v-btn>
      <v-btn v-if="form.accessCode" color="secondary" prepend-icon="mdi-open-in-new" @click="openCandidatePortal">
        Test as Intern
      </v-btn>
    </div>
  </div>

  <v-snackbar v-model="copiedNotice" :timeout="3000" color="success" location="top right">
    {{ copiedNotice }}
  </v-snackbar>

  <v-progress-linear v-if="loading" indeterminate color="primary" />

  <v-row v-else>
    <v-col cols="12" md="8">
      <v-form @submit.prevent="save(false)">
        <v-card class="pa-5 mb-6" variant="outlined">
          <div class="text-subtitle-1 font-weight-bold mb-3">1. General Information</div>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="form.title" label="Assessment Title" placeholder="e.g. SDE-1 Backend Coding Round" required />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.description" label="Instructions & Description" rows="2" placeholder="Explain rules, time limits, or allowed libraries." />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="form.durationMinutes" type="number" min="1" label="Duration (minutes)" required />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.status" :items="statusOptions" label="Assessment Status" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.startsAt" type="datetime-local" label="Starts at (optional)" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.endsAt" type="datetime-local" label="Ends at (optional)" />
            </v-col>
          </v-row>
        </v-card>

        <!-- Question Bank Selector & Question Picker -->
        <v-card class="pa-5 mb-6" variant="outlined">
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
            <div class="text-subtitle-1 font-weight-bold">2. Choose Question Bank & Questions</div>
            <v-chip color="primary" variant="tonal" size="small">
              {{ attachedQuestions.length }} selected ({{ totalMarks }} marks)
            </v-chip>
          </div>

          <v-row class="mb-2">
            <v-col cols="12" sm="7">
              <v-select
                v-model="selectedBankId"
                :items="questionBanks.map((b) => ({ title: `${b.name} (${b.questions?.length || 0} questions)`, value: b._id }))"
                label="Select Question Bank"
                density="comfortable"
                hide-details
              />
            </v-col>
            <v-col cols="12" sm="5">
              <v-select
                v-model="selectedDifficulty"
                :items="difficultyOptions"
                label="Difficulty Filter"
                density="comfortable"
                hide-details
              />
            </v-col>
          </v-row>

          <!-- Action buttons for selected bank -->
          <div v-if="filteredBankQuestions.length > 0" class="d-flex ga-2 mb-3">
            <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-checkbox-multiple-marked" @click="selectAllFromBank">
              Select all ({{ filteredBankQuestions.length }})
            </v-btn>
            <v-btn size="small" variant="outlined" prepend-icon="mdi-checkbox-blank-outline" @click="clearAllFromBank">
              Clear bank selection
            </v-btn>
          </div>

          <!-- Question Bank list with checkboxes -->
          <v-list density="compact" class="rounded border mb-4" style="max-height: 280px; overflow-y: auto;">
            <v-list-item
              v-for="q in filteredBankQuestions"
              :key="q._id"
              class="py-2"
              @click="toggleQuestion(q)"
            >
              <template #prepend>
                <v-checkbox-btn
                  :model-value="attachedIds.has(q._id)"
                  class="mr-2"
                  @click.stop="toggleQuestion(q)"
                />
              </template>
              <template #title>
                <span class="font-weight-medium">{{ q.title }}</span>
              </template>
              <template #subtitle>
                <span class="text-capitalize">{{ q.type }}</span> · {{ q.marks }} marks
              </template>
              <template #append>
                <v-chip
                  size="x-small"
                  :color="q.difficulty === 'easy' ? 'success' : q.difficulty === 'hard' ? 'error' : 'warning'"
                  variant="tonal"
                  class="text-uppercase font-weight-bold mr-2"
                >
                  {{ q.difficulty || 'medium' }}
                </v-chip>
              </template>
            </v-list-item>
            <v-list-item v-if="filteredBankQuestions.length === 0">
              <span class="text-medium-emphasis">No questions match the selected filter.</span>
            </v-list-item>
          </v-list>

          <div class="text-caption text-medium-emphasis mb-2">
            Selected Questions on this Assessment:
          </div>
          <v-list density="compact" class="rounded border">
            <v-list-item v-for="q in attachedQuestions" :key="q._id">
              <template #title>{{ q.title }}</template>
              <template #subtitle>{{ q.type }} · {{ q.marks }} marks</template>
              <template #append>
                <v-btn icon="mdi-close" size="small" variant="text" color="error" @click="removeQuestion(q._id)" />
              </template>
            </v-list-item>
            <v-list-item v-if="attachedQuestions.length === 0">
              <span class="text-medium-emphasis text-caption">No questions attached yet. Select questions from the bank above.</span>
            </v-list-item>
          </v-list>
        </v-card>

        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

        <div class="d-flex ga-3">
          <v-btn variant="outlined" @click="router.push('/')">Cancel</v-btn>
          <v-btn type="button" color="success" prepend-icon="mdi-cloud-upload" :loading="saving" @click="save(true)">
            Publish Assessment
          </v-btn>
          <v-btn type="submit" color="primary" :loading="saving">Save Changes</v-btn>
        </div>
      </v-form>
    </v-col>

    <!-- Right Column: Access Code & Intern Credentials -->
    <v-col cols="12" md="4">
      <v-card class="pa-5 mb-4" variant="elevated" style="position: sticky; top: 20px;">
        <div class="d-flex align-center justify-space-between mb-2">
          <span class="text-overline text-primary font-weight-bold">INTERN CREDENTIALS</span>
          <v-chip size="small" :color="form.status === 'active' ? 'success' : 'default'" variant="tonal">
            {{ form.status }}
          </v-chip>
        </div>

        <div v-if="form.accessCode" class="mt-2">
          <div class="text-caption text-medium-emphasis mb-1">6-Digit Access Code</div>
          <div class="d-flex align-center justify-space-between pa-3 rounded bg-surface-variant border mb-3">
            <span class="text-h4 font-weight-bold font-monospace tracking-widest text-primary">
              {{ form.accessCode }}
            </span>
            <v-btn
              icon="mdi-content-copy"
              variant="text"
              color="primary"
              title="Copy Code"
              @click="copyToClipboard(form.accessCode, 'Access code')"
            />
          </div>

          <div class="text-caption text-medium-emphasis mb-1">Direct Exam Link</div>
          <div class="d-flex align-center ga-1 mb-4">
            <v-text-field
              :model-value="candidateExamUrl"
              readonly
              density="compact"
              hide-details
              variant="outlined"
            />
            <v-btn
              icon="mdi-content-copy"
              variant="tonal"
              color="primary"
              title="Copy Link"
              @click="copyToClipboard(candidateExamUrl, 'Exam link')"
            />
          </div>

          <v-btn
            color="primary"
            block
            prepend-icon="mdi-open-in-new"
            class="mb-2"
            @click="openCandidatePortal"
          >
            Open Intern Test
          </v-btn>

          <v-btn
            variant="outlined"
            block
            prepend-icon="mdi-chart-box-outline"
            :to="`/exams/${id}/candidates`"
          >
            View Submissions
          </v-btn>
        </div>

        <div v-else class="text-center py-6">
          <v-icon icon="mdi-shield-key-outline" size="48" color="primary" class="mb-2" />
          <div class="text-subtitle-1 font-weight-bold mb-1">Ready to Publish</div>
          <p class="text-caption text-medium-emphasis mb-4">
            Click "Publish Assessment" to generate the unique 6-character access code and direct link for your interns.
          </p>
          <v-btn color="success" block :loading="saving" @click="save(true)">
            Generate Code & Publish
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<style scoped>
.tracking-widest {
  letter-spacing: 4px;
}
</style>
