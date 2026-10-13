<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { questionsApi } from '../api';

const props = defineProps({ id: { type: String, default: null } });
const router = useRouter();
const isEdit = computed(() => !!props.id);

const saving = ref(false);
const error = ref('');
const loading = ref(isEdit.value);
const uploadingMedia = ref(false);
const mediaError = ref('');

const typeOptions = [
  { title: 'MCQ (single answer)', value: 'mcq' },
  { title: 'Multi-select', value: 'multi_select' },
  { title: 'True / False', value: 'true_false' },
  { title: 'Fill in the blank', value: 'fill_blank' },
  { title: 'Subjective', value: 'subjective' },
  { title: 'Coding', value: 'coding' },
  { title: 'File upload', value: 'file_upload' },
];
const difficultyOptions = [
  { title: 'Easy', value: 'easy' },
  { title: 'Medium', value: 'medium' },
  { title: 'Hard', value: 'hard' },
];

const form = reactive({
  type: 'mcq',
  title: '',
  statement: '',
  constraints: '',
  marks: 1,
  negativeMarks: 0,
  difficulty: 'medium',
  tagsInput: '',
  group: '',
  media: [], // [{ kind: 'image'|'video', url, caption }]
  options: [
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
  ],
  expectedAnswer: '',
  allowedLanguages: [],
  starterCode: [{ language: 'python', version: '3.12.0', code: '' }],
  testCases: [{ input: '', expectedOutput: '', isHidden: true, points: 1 }],
  timeLimitMs: 2000,
  memoryLimitKb: 256000,
  examples: [],
  customCheckerCode: '',
});

const trueFalseValue = computed({
  get: () => (form.options.find((o) => o.isCorrect)?.text?.toLowerCase() === 'false' ? 'false' : 'true'),
  set: (val) => {
    form.options = [
      { text: 'True', isCorrect: val === 'true' },
      { text: 'False', isCorrect: val === 'false' },
    ];
  },
});

onMounted(async () => {
  if (isEdit.value) {
    const q = await questionsApi.get(props.id);
    Object.assign(form, {
      ...q,
      tagsInput: (q.tags || []).join(', '),
      options: q.options?.length ? q.options : form.options,
      starterCode: q.starterCode?.length ? q.starterCode : form.starterCode,
      testCases: q.testCases?.length ? q.testCases : form.testCases,
      allowedLanguages: q.allowedLanguages || [],
      examples: q.examples || [],
      customCheckerCode: q.customCheckerCode || '',
      group: q.group || '',
      media: q.media || [],
    });
    loading.value = false;
  }
});

async function onMediaFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  mediaError.value = '';
  uploadingMedia.value = true;
  try {
    const res = await questionsApi.uploadMedia(file);
    form.media.push({ kind: res.kind, url: res.url, caption: '' });
  } catch (err) {
    mediaError.value = err.response?.data?.message || 'Could not upload that file.';
  } finally {
    uploadingMedia.value = false;
    e.target.value = '';
  }
}
function removeMedia(i) {
  form.media.splice(i, 1);
}

function addOption() {
  form.options.push({ text: '', isCorrect: false });
}
function removeOption(i) {
  form.options.splice(i, 1);
}
function addStarterCode() {
  form.starterCode.push({ language: '', version: 'latest', code: '' });
}
function removeStarterCode(i) {
  form.starterCode.splice(i, 1);
}
function addTestCase() {
  form.testCases.push({ input: '', expectedOutput: '', isHidden: true, points: 1 });
}
function removeTestCase(i) {
  form.testCases.splice(i, 1);
}
function addExample() {
  form.examples.push({ input: '', output: '', explanation: '' });
}
function removeExample(i) {
  form.examples.splice(i, 1);
}

async function save() {
  saving.value = true;
  error.value = '';
  try {
    const payload = {
      type: form.type,
      title: form.title,
      statement: form.statement,
      constraints: form.constraints,
      marks: Number(form.marks),
      negativeMarks: Number(form.negativeMarks) || 0,
      difficulty: form.difficulty,
      tags: form.tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      group: form.group.trim(),
      media: form.media,
    };

    if (['mcq', 'multi_select', 'true_false'].includes(form.type)) {
      payload.options = form.options.filter((o) => o.text || form.type === 'true_false');
    }
    if (['fill_blank', 'subjective'].includes(form.type)) {
      payload.expectedAnswer = form.expectedAnswer;
    }
    if (form.type === 'coding') {
      payload.starterCode = form.starterCode.filter((s) => s.language);
      payload.allowedLanguages = payload.starterCode.map((s) => s.language);
      payload.testCases = form.testCases.filter((t) => t.expectedOutput !== '');
      payload.timeLimitMs = Number(form.timeLimitMs);
      payload.memoryLimitKb = Number(form.memoryLimitKb);
      payload.examples = form.examples.filter((e) => e.input || e.output);
      payload.customCheckerCode = form.customCheckerCode || null;
    }

    if (isEdit.value) {
      await questionsApi.update(props.id, payload);
    } else {
      await questionsApi.create(payload);
    }
    router.push('/questions');
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not save the question.';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-6">{{ isEdit ? 'Edit question' : 'New question' }}</h1>

  <v-progress-linear v-if="loading" indeterminate color="primary" />

  <v-form v-else @submit.prevent="save">
    <v-row style="max-width: 900px">
      <v-col cols="12" md="6">
        <v-select v-model="form.type" :items="typeOptions" label="Type" :disabled="isEdit" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.title" label="Title" required placeholder="Short, descriptive title" />
      </v-col>

      <v-col cols="12">
        <v-textarea v-model="form.statement" label="Statement" rows="4" required placeholder="The question itself" />
      </v-col>

      <v-col cols="12" v-if="form.type === 'coding'">
        <v-text-field v-model="form.constraints" label="Constraints" placeholder="e.g. 1 <= n <= 10^5" />
      </v-col>

      <v-col cols="12" sm="4">
        <v-text-field v-model.number="form.marks" type="number" min="0" step="0.5" label="Marks" required />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model.number="form.negativeMarks" type="number" min="0" step="0.5" label="Negative marks" />
      </v-col>
      <v-col cols="12" sm="4">
        <v-select v-model="form.difficulty" :items="difficultyOptions" label="Difficulty" />
      </v-col>

      <v-col cols="12" sm="6">
        <v-text-field v-model="form.tagsInput" label="Tags (comma separated)" placeholder="arrays, dynamic-programming" />
      </v-col>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="form.group"
          label="Group (optional)"
          placeholder="e.g. Python Basics Set 1"
          hint="Questions sharing a group can be added to an exam all at once from the exam editor."
          persistent-hint
        />
      </v-col>

      <!-- Media (image/video) attached to the statement -->
      <v-col cols="12">
        <div class="text-caption text-medium-emphasis mb-2">Images / videos (optional)</div>
        <div v-if="form.media.length" class="d-flex flex-wrap ga-3 mb-3">
          <v-card v-for="(m, i) in form.media" :key="i" variant="tonal" class="pa-2" style="width: 160px">
            <img v-if="m.kind === 'image'" :src="m.url" class="media-thumb" />
            <video v-else :src="m.url" class="media-thumb" controls />
            <v-text-field
              v-model="m.caption"
              placeholder="Caption (optional)"
              hide-details
              density="compact"
              class="mt-2"
            />
            <v-btn size="small" variant="text" color="error" block class="mt-1" @click="removeMedia(i)">Remove</v-btn>
          </v-card>
        </div>
        <v-file-input
          label="Upload image or video"
          accept="image/png,image/jpeg,image/gif,image/webp,video/mp4,video/webm"
          prepend-icon="mdi-image-plus"
          density="comfortable"
          hide-details
          :loading="uploadingMedia"
          :disabled="uploadingMedia"
          @change="onMediaFileChange"
        />
        <v-alert v-if="mediaError" type="error" variant="tonal" density="compact" class="mt-2">{{ mediaError }}</v-alert>
      </v-col>

      <!-- MCQ / multi-select -->
      <v-col cols="12" v-if="['mcq', 'multi_select'].includes(form.type)">
        <div class="text-caption text-medium-emphasis mb-2">Options — check the correct one(s)</div>
        <div v-for="(opt, i) in form.options" :key="i" class="d-flex align-center ga-3 mb-2">
          <v-checkbox v-if="form.type === 'multi_select'" v-model="opt.isCorrect" hide-details density="compact" />
          <v-radio-group
            v-else
            :model-value="form.options.findIndex((o) => o.isCorrect)"
            hide-details
            density="compact"
            class="d-inline-flex"
            @update:model-value="(idx) => form.options.forEach((o, oi) => (o.isCorrect = oi === idx))"
          >
            <v-radio :value="i" density="compact" hide-details />
          </v-radio-group>
          <v-text-field v-model="opt.text" placeholder="Option text" hide-details density="compact" />
          <v-btn icon="mdi-close" size="small" variant="text" @click="removeOption(i)" />
        </div>
        <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addOption">Add option</v-btn>
      </v-col>

      <!-- True/False -->
      <v-col cols="12" sm="6" v-if="form.type === 'true_false'">
        <v-select
          v-model="trueFalseValue"
          label="Correct answer"
          :items="[{ title: 'True', value: 'true' }, { title: 'False', value: 'false' }]"
        />
      </v-col>

      <!-- Fill blank / subjective -->
      <v-col cols="12" v-if="['fill_blank', 'subjective'].includes(form.type)">
        <v-textarea
          v-model="form.expectedAnswer"
          rows="3"
          :label="form.type === 'fill_blank' ? 'Expected answer' : 'Model answer (for manual grading reference)'"
        />
      </v-col>

      <!-- Coding -->
      <template v-if="form.type === 'coding'">
        <v-col cols="12" sm="6">
          <v-text-field v-model.number="form.timeLimitMs" type="number" label="Time limit (ms)" />
        </v-col>
        <v-col cols="12" sm="6">
          <v-text-field v-model.number="form.memoryLimitKb" type="number" label="Memory limit (KB)" />
        </v-col>

        <v-col cols="12">
          <div class="text-caption text-medium-emphasis mb-2">Starter code per language</div>
          <v-card v-for="(s, i) in form.starterCode" :key="i" variant="tonal" class="pa-3 mb-3">
            <div class="d-flex ga-3 mb-2">
              <v-text-field v-model="s.language" placeholder="language (e.g. python)" hide-details density="compact" />
              <v-text-field v-model="s.version" placeholder="version (e.g. 3.12.0)" hide-details density="compact" />
              <v-btn icon="mdi-close" size="small" variant="text" @click="removeStarterCode(i)" />
            </div>
            <v-textarea v-model="s.code" rows="4" placeholder="Starter code template" hide-details class="mono-field" />
          </v-card>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addStarterCode">Add language</v-btn>
        </v-col>

        <v-col cols="12">
          <div class="text-caption text-medium-emphasis mb-2">Examples (shown to candidates)</div>
          <div v-for="(ex, i) in form.examples" :key="i" class="d-flex ga-3 mb-2">
            <v-text-field v-model="ex.input" placeholder="Example input" hide-details density="compact" />
            <v-text-field v-model="ex.output" placeholder="Example output" hide-details density="compact" />
            <v-btn icon="mdi-close" size="small" variant="text" @click="removeExample(i)" />
          </div>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addExample">Add example</v-btn>
        </v-col>

        <v-col cols="12">
          <div class="text-caption text-medium-emphasis mb-2">
            Test cases — uncheck "hidden" for ones candidates can see when they click "Run"
          </div>
          <v-card v-for="(tc, i) in form.testCases" :key="i" variant="tonal" class="pa-3 mb-3">
            <div class="d-flex ga-3 align-center flex-wrap">
              <v-text-field v-model="tc.input" placeholder="stdin input" hide-details density="compact" />
              <v-text-field v-model="tc.expectedOutput" placeholder="expected stdout" required hide-details density="compact" />
              <v-text-field v-model.number="tc.points" type="number" min="1" placeholder="points" hide-details density="compact" style="max-width: 100px" />
              <v-checkbox v-model="tc.isHidden" label="Hidden" hide-details density="compact" />
              <v-btn icon="mdi-close" size="small" variant="text" @click="removeTestCase(i)" />
            </div>
          </v-card>
          <v-btn size="small" variant="tonal" prepend-icon="mdi-plus" @click="addTestCase">Add test case</v-btn>
        </v-col>

        <v-col cols="12">
          <v-textarea
            v-model="form.customCheckerCode"
            rows="6"
            class="mono-field"
            label="Custom checker script (optional)"
            hint='Runs in the candidate&#39;s own submitted language/version, receiving {"input","expected","actual"} as JSON on stdin. Must print PASS or FAIL as the last output line. Leave blank to use exact-match comparison.'
            persistent-hint
          />
        </v-col>
      </template>

      <v-col cols="12" v-if="error">
        <v-alert type="error" variant="tonal">{{ error }}</v-alert>
      </v-col>

      <v-col cols="12" class="d-flex ga-3">
        <v-btn variant="outlined" @click="router.push('/questions')">Cancel</v-btn>
        <v-btn type="submit" color="primary" :loading="saving">Save question</v-btn>
      </v-col>
    </v-row>
  </v-form>
</template>

<style scoped>
.mono-field :deep(textarea) {
  font-family: 'Roboto Mono', ui-monospace, monospace;
  font-size: 0.85rem;
}
.media-thumb {
  width: 100%;
  height: 90px;
  object-fit: cover;
  border-radius: 4px;
  display: block;
}
</style>
