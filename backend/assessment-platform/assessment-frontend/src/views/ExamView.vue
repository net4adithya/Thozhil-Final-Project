<script setup>
import { ref, shallowRef, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import examApi from '../api/examApi';
import { useCountdown } from '../composables/useCountdown';
import { useProctoring } from '../composables/useProctoring';
import TimerChip from '../components/TimerChip.vue';
import QuestionNavigator from '../components/QuestionNavigator.vue';
import McqQuestion from '../components/McqQuestion.vue';
import SubjectiveQuestion from '../components/SubjectiveQuestion.vue';
import CodingQuestion from '../components/CodingQuestion.vue';
import FileUploadQuestion from '../components/FileUploadQuestion.vue';
import ViolationBanner from '../components/ViolationBanner.vue';
import RecordingIndicator from '../components/RecordingIndicator.vue';
import ProctoringGate from './ProctoringGate.vue';
import EmailGate from './EmailGate.vue';

const props = defineProps({ token: { type: String, required: true } });
const router = useRouter();

// Default emailVerified to true so candidates entering with access code go straight to test
const emailVerified = ref(true);
const emailVerifying = ref(false);
const emailError = ref('');

const loading = ref(true);
const loadError = ref('');
const exam = ref(null);
const questions = ref([]);
const currentIndex = ref(0);

// answers[questionId] = { selectedOptionIds?, textAnswer?, code?, language? }
const answers = reactive({});
const answeredIds = computed(() => {
  const set = new Set();
  for (const [qid, a] of Object.entries(answers)) {
    const hasContent =
      (a.selectedOptionIds && a.selectedOptionIds.length) ||
      (a.textAnswer && a.textAnswer.trim()) ||
      (a.code && a.code.trim()) ||
      a.fileUrl;
    if (hasContent) set.add(qid);
  }
  return set;
});

const currentQuestion = computed(() => questions.value[currentIndex.value]);

const timer = shallowRef(null);
const submitting = ref(false);
const submitError = ref('');

const showInstructions = ref(false);

const proctoringNeeded = computed(() => {
  const p = exam.value?.proctoring;
  return !!(p && (p.webcam || p.screenShare || p.fullscreenRequired));
});
const proctoringReady = ref(false);
const proctoringStarting = ref(false);
let proctoring = null;

const isFullscreenExited = ref(false);

function checkFullscreenState() {
  if (proctoringReady.value && !document.fullscreenElement) {
    isFullscreenExited.value = true;
  } else {
    isFullscreenExited.value = false;
  }
}

async function forceFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    }
    isFullscreenExited.value = false;
  } catch (err) {
    console.error('Fullscreen request failed:', err);
  }
}

onMounted(() => {
  load();
  document.addEventListener('fullscreenchange', checkFullscreenState);
});

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await examApi.getExam(props.token);
    // Guarantee fullscreen & proctoring defaults for all assessments
    if (!data.exam.proctoring) {
      data.exam.proctoring = { fullscreenRequired: true, maxViolations: 5 };
    } else {
      data.exam.proctoring.fullscreenRequired = true;
    }
    exam.value = data.exam;
    questions.value = data.questions;

    const startedAt = new Date(data.candidate.startedAt || Date.now());
    const endsAt = new Date(startedAt.getTime() + exam.value.durationMinutes * 60 * 1000);
    timer.value = useCountdown(endsAt, handleAutoSubmit);

    proctoring = useProctoring(props.token, exam.value.proctoring, handleAutoSubmit);
    proctoringReady.value = false; // Always demand candidate click to initiate fullscreen & proctoring
  } catch (err) {
    loadError.value = err.response?.data?.message || 'Could not load this exam. Check your link and try again.';
  } finally {
    loading.value = false;
  }
}

async function beginProctoredExam() {
  proctoringStarting.value = true;
  try {
    await proctoring.start();
    await forceFullscreen();
  } finally {
    proctoringStarting.value = false;
    proctoringReady.value = true;
  }
}

function answerFor(question) {
  if (!answers[question._id]) {
    answers[question._id] =
      question.type === 'coding'
        ? { code: '', language: '' }
        : question.type === 'file_upload'
        ? { fileUrl: '', originalName: '' }
        : ['mcq', 'multi_select', 'true_false'].includes(question.type)
        ? { selectedOptionIds: [] }
        : { textAnswer: '' };
  }
  return answers[question._id];
}

// Debounced autosave: fires 800ms after the candidate stops typing/selecting,
// per question, so we don't hammer the API on every keystroke.
const saveTimers = {};
function scheduleSave(question) {
  clearTimeout(saveTimers[question._id]);
  saveTimers[question._id] = setTimeout(() => doSave(question), 800);
}

async function doSave(question) {
  const a = answers[question._id];
  try {
    await examApi.saveAnswer(props.token, { questionId: question._id, ...a });
  } catch {
    // Autosave failures are silent by design
  }
}

function onMcqChange(question, val) {
  answerFor(question).selectedOptionIds = val;
  scheduleSave(question);
}
function onTextChange(question, val) {
  answerFor(question).textAnswer = val;
  scheduleSave(question);
}
function onCodeChange(question, val) {
  const a = answerFor(question);
  a.code = val.code;
  a.language = val.language;
  scheduleSave(question);
}
function onFileChange(question, val) {
  const a = answerFor(question);
  a.fileUrl = val.fileUrl;
  a.originalName = val.originalName;
}

function selectQuestion(i) {
  currentIndex.value = i;
}

async function handleAutoSubmit(reason) {
  await doSubmit(true, reason);
}

function confirmSubmit() {
  const unanswered = questions.value.length - answeredIds.value.size;
  const msg =
    unanswered > 0
      ? `You have ${unanswered} unanswered question(s). Submit anyway? This can't be undone.`
      : "Submit your exam now? This can't be undone.";
  if (window.confirm(msg)) doSubmit(false);
}

async function doSubmit(isAuto, reason) {
  if (submitting.value) return;
  submitting.value = true;
  submitError.value = '';
  try {
    await Promise.race([
      proctoring?.stopAll(),
      new Promise((res) => setTimeout(res, 1500)),
    ]);
    try {
      await examApi.submitExam(props.token);
    } catch (err) {
      const alreadyDone = err.response?.status === 403 && /already|banned|submitted/i.test(err.response?.data?.message || '');
      if (!alreadyDone) throw err;
    }
    router.push({
      name: 'submitted',
      params: { token: props.token },
      query: reason ? { reason } : {},
    });
  } catch (err) {
    submitError.value = isAuto
      ? 'Submitting assessment...'
      : err.response?.data?.message || 'Could not submit. Please try again.';
    if (isAuto) {
      router.push({
        name: 'submitted',
        params: { token: props.token },
        query: reason ? { reason } : {},
      });
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <EmailGate
    v-if="!emailVerified"
    :verifying="emailVerifying"
    :error="emailError"
    @confirm="verifyEmail"
  />

  <div v-else-if="loading" class="state">Loading your exam…</div>
  <div v-else-if="loadError" class="state error">{{ loadError }}</div>

  <ProctoringGate
    v-else-if="!proctoringReady"
    :exam="exam"
    :proctoring="exam.proctoring"
    :starting="proctoringStarting"
    @begin="beginProctoredExam"
  />

  <div v-else class="layout">
    <div v-if="proctoringReady && isFullscreenExited" class="fullscreen-modal-overlay">
      <div class="fullscreen-modal-card">
        <div class="fs-icon">⚠️</div>
        <h2>Fullscreen Mode Required</h2>
        <p>This assessment must be taken in Fullscreen Mode to ensure test integrity. Exiting fullscreen is logged as a security violation.</p>
        <button class="fs-btn" @click="forceFullscreen">Return to Fullscreen</button>
      </div>
    </div>
    <ViolationBanner
      v-if="proctoring && proctoring.violationCount.value > 0"
      class="banner-area"
      :message="proctoring.lastWarning.value"
      :count="proctoring.violationCount.value"
      :threshold="exam.proctoring?.maxViolations || 3"
    />
    <header class="topbar">
      <div class="title">{{ exam.title }}</div>
      <div class="topbar-right">
        <RecordingIndicator
          v-if="proctoring"
          :webcam-required="!!exam.proctoring?.webcam"
          :webcam-granted="proctoring.webcamGranted.value"
          :screen-required="!!exam.proctoring?.screenShare"
          :screen-granted="proctoring.screenGranted.value"
        />
        <TimerChip v-if="timer" :label="timer.label.value" :severity="timer.severity.value" />
      </div>
    </header>

    <aside class="sidebar">
      <div v-if="exam?.description" class="instructions-accordion mb-3">
        <button class="instructions-toggle" @click="showInstructions = !showInstructions">
          <span>📋 Instructions & Rules</span>
          <span class="arrow">{{ showInstructions ? '▲' : '▼' }}</span>
        </button>
        <div v-if="showInstructions" class="instructions-body">
          {{ exam.description }}
        </div>
      </div>

      <div class="progress">{{ answeredIds.size }} / {{ questions.length }} answered</div>
      <QuestionNavigator
        :questions="questions"
        :current-index="currentIndex"
        :answered-ids="answeredIds"
        @select="selectQuestion"
      />
      <button class="submit-btn" :disabled="submitting" @click="confirmSubmit">
        {{ submitting ? 'Submitting…' : 'Submit exam' }}
      </button>
      <p v-if="submitError" class="submit-error">{{ submitError }}</p>
    </aside>

    <main class="content" v-if="currentQuestion">
      <div class="q-meta">
        <span class="q-type">{{ currentQuestion.type.replace('_', ' ') }}</span>
        <span class="q-marks">{{ currentQuestion.marks }} marks</span>
      </div>
      <h2 class="q-title">{{ currentQuestion.title }}</h2>

      <div v-if="currentQuestion.media?.length" class="q-media">
        <figure v-for="(m, i) in currentQuestion.media" :key="i" class="q-media-item">
          <img v-if="m.kind === 'image'" :src="m.url" :alt="m.caption || currentQuestion.title" />
          <video v-else :src="m.url" controls preload="metadata" />
          <figcaption v-if="m.caption">{{ m.caption }}</figcaption>
        </figure>
      </div>

      <p class="q-statement">{{ currentQuestion.statement }}</p>

      <div v-if="currentQuestion.constraints" class="q-constraints">
        <strong>Constraints:</strong> {{ currentQuestion.constraints }}
      </div>

      <div v-if="currentQuestion.examples?.length" class="q-examples">
        <div v-for="(ex, i) in currentQuestion.examples" :key="i" class="example">
          <div><span class="ex-label">Input</span><pre>{{ ex.input }}</pre></div>
          <div><span class="ex-label">Output</span><pre>{{ ex.output }}</pre></div>
        </div>
      </div>

      <McqQuestion
        v-if="['mcq', 'multi_select', 'true_false'].includes(currentQuestion.type)"
        :key="currentQuestion._id"
        :question="currentQuestion"
        :model-value="answerFor(currentQuestion).selectedOptionIds"
        @update:model-value="(v) => onMcqChange(currentQuestion, v)"
      />

      <SubjectiveQuestion
        v-else-if="['subjective', 'fill_blank'].includes(currentQuestion.type)"
        :key="currentQuestion._id"
        :multiline="currentQuestion.type === 'subjective'"
        :model-value="answerFor(currentQuestion).textAnswer"
        @update:model-value="(v) => onTextChange(currentQuestion, v)"
      />

      <CodingQuestion
        v-else-if="currentQuestion.type === 'coding'"
        :key="currentQuestion._id"
        :token="token"
        :question="currentQuestion"
        :model-value="answerFor(currentQuestion)"
        @update:model-value="(v) => onCodeChange(currentQuestion, v)"
      />

      <FileUploadQuestion
        v-else-if="currentQuestion.type === 'file_upload'"
        :key="currentQuestion._id"
        :token="token"
        :question-id="currentQuestion._id"
        :model-value="answerFor(currentQuestion)"
        @update:model-value="(v) => onFileChange(currentQuestion, v)"
      />

      <div class="nav-buttons">
        <button :disabled="currentIndex === 0" @click="currentIndex--">Previous</button>
        <button :disabled="currentIndex === questions.length - 1" @click="currentIndex++">Next</button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.state {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  font-family: var(--font-display);
}
.state.error {
  color: var(--signal-red);
}

.layout {
  min-height: 100%;
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: auto auto 1fr;
  grid-template-areas:
    'banner banner'
    'topbar topbar'
    'sidebar content';
}

.banner-area {
  grid-area: banner;
}

.topbar {
  grid-area: topbar;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 28px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
}

.title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.05rem;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.sidebar {
  grid-area: sidebar;
  padding: 24px 18px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.progress {
  font-size: 0.8rem;
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.submit-btn {
  margin-top: auto;
  padding: 13px;
  background: var(--signal-green);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
}

.submit-btn:disabled {
  opacity: 0.6;
}

.submit-error {
  color: var(--signal-red);
  font-size: 0.78rem;
  line-height: 1.4;
}

.content {
  grid-area: content;
  padding: 32px 40px;
  max-width: 900px;
}

.q-meta {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.q-type {
  text-transform: uppercase;
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  color: var(--accent);
  font-family: var(--font-display);
}

.q-marks {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.q-title {
  font-family: var(--font-display);
  font-size: 1.4rem;
  margin: 0 0 14px;
}

.q-statement {
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
}

.q-media {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 0 0 18px;
}

.q-media-item {
  margin: 0;
  max-width: 420px;
}

.q-media-item img,
.q-media-item video {
  display: block;
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel);
}

.q-media-item figcaption {
  margin-top: 6px;
  font-size: 0.78rem;
  color: var(--text-muted);
}

.q-constraints {
  margin-top: 14px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.q-examples {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ex-label {
  display: block;
  font-size: 0.7rem;
  text-transform: uppercase;
  color: var(--text-faint);
  margin-bottom: 4px;
}

.example pre {
  margin: 0;
  padding: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-family: var(--font-mono);
  font-size: 0.82rem;
}

.nav-buttons {
  display: flex;
  gap: 12px;
  margin-top: 28px;
}

.nav-buttons button {
  padding: 10px 20px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}

.nav-buttons button:disabled {
  opacity: 0.4;
}

@media (max-width: 800px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'banner'
      'topbar'
      'sidebar'
      'content';
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid var(--border);
  }
}

.fullscreen-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(15, 23, 42, 0.94);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.fullscreen-modal-card {
  max-width: 440px;
  width: 100%;
  background: #ffffff;
  border: 2px solid #006491;
  border-radius: 12px;
  padding: 36px 32px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
}

.fs-icon {
  font-size: 2.8rem;
  margin-bottom: 12px;
}

.fullscreen-modal-card h2 {
  font-family: var(--font-display);
  font-size: 1.45rem;
  color: #0f172a;
  margin: 0 0 12px;
}

.fullscreen-modal-card p {
  color: #475569;
  font-size: 0.92rem;
  line-height: 1.55;
  margin: 0 0 26px;
}

.fs-btn {
  width: 100%;
  padding: 14px;
  background: #006491;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.fs-btn:hover {
  background: #0284c7;
}

.instructions-accordion {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel);
  overflow: hidden;
}

.instructions-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: var(--bg);
  border: none;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--accent);
  cursor: pointer;
  text-align: left;
}

.instructions-toggle:hover {
  background: var(--panel);
}

.instructions-body {
  padding: 10px 12px;
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.5;
  white-space: pre-wrap;
  border-top: 1px solid var(--border);
  background: var(--panel);
  max-height: 160px;
  overflow-y: auto;
}
</style>
