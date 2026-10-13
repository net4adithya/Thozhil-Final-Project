<script setup>
const props = defineProps({
  exam: { type: Object, default: () => ({}) },
  proctoring: { type: Object, required: true },
  starting: { type: Boolean, default: false },
});
const emit = defineEmits(['begin']);

const requirements = [
  { key: 'webcam', label: 'Webcam access', desc: 'Your camera will record throughout the exam.' },
  { key: 'screenShare', label: 'Screen sharing', desc: 'Your screen will be recorded throughout the exam.' },
  { key: 'fullscreenRequired', label: 'Fullscreen mode', desc: 'The exam must stay in fullscreen — exiting is logged.' },
];

const MOBILE_UA_RE = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i;
function isMobileDevice() {
  const uaMobile = MOBILE_UA_RE.test(navigator.userAgent);
  const noScreenCapture = !navigator.mediaDevices?.getDisplayMedia;
  const touchLike = navigator.maxTouchPoints > 1 && noScreenCapture;
  return uaMobile || touchLike;
}

const requiresScreenShare = !!props.proctoring.screenShare;
const blockedOnMobile = requiresScreenShare && isMobileDevice();
</script>

<template>
  <div class="wrap">
    <div class="card">
      <div class="eyebrow">Assessment Overview</div>
      <h1 v-if="exam.title" class="exam-title">{{ exam.title }}</h1>
      <h1 v-else>This exam is proctored</h1>

      <div v-if="exam.description" class="instructions-box">
        <div class="instructions-header">
          <span class="icon">📋</span>
          <span class="title">Instructions & Description</span>
        </div>
        <div class="instructions-content">{{ exam.description }}</div>
      </div>

      <template v-if="blockedOnMobile">
        <p class="note blocked">
          This exam requires screen recording, which mobile browsers don't support. Please
          switch to a desktop or laptop computer to take this exam.
        </p>
      </template>
      <template v-else>
        <div class="proctoring-heading">Proctoring Requirements:</div>
        <ul class="reqs">
          <li v-for="r in requirements.filter((r) => proctoring[r.key])" :key="r.key">
            <span class="dot" />
            <div>
              <div class="label">{{ r.label }}</div>
              <div class="desc">{{ r.desc }}</div>
            </div>
          </li>
        </ul>
        <p class="note">
          You'll be asked to grant these permissions in your browser. Leaving fullscreen, switching
          tabs, or stopping screen share is logged as a violation
          <template v-if="proctoring.maxViolations">
            — after {{ proctoring.maxViolations }} the exam auto-submits.
          </template>
        </p>
        <button :disabled="starting" @click="emit('begin')">
          {{ starting ? 'Setting up…' : 'Grant permissions & begin' }}
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.card {
  width: 100%;
  max-width: 520px;
  padding: 36px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
}

.eyebrow {
  font-family: var(--font-display);
  font-size: 0.75rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  font-weight: 700;
  margin-bottom: 8px;
}

h1 {
  font-family: var(--font-display);
  font-size: 1.45rem;
  margin: 0 0 18px;
  color: var(--text-main);
}

.instructions-box {
  background: var(--bg);
  border: 1px solid var(--border);
  border-left: 4px solid var(--accent);
  border-radius: var(--radius-sm);
  padding: 14px 16px;
  margin-bottom: 22px;
}

.instructions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--text-main);
  margin-bottom: 6px;
}

.instructions-content {
  font-size: 0.85rem;
  color: var(--text-muted);
  line-height: 1.55;
  white-space: pre-wrap;
}

.proctoring-heading {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-main);
  margin-bottom: 12px;
}

.reqs {
  list-style: none;
  margin: 0 0 20px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.reqs li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.dot {
  margin-top: 6px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  flex-shrink: 0;
}

.label {
  font-weight: 600;
  font-size: 0.92rem;
}

.desc {
  color: var(--text-muted);
  font-size: 0.82rem;
  margin-top: 2px;
}

.note {
  font-size: 0.8rem;
  color: var(--text-faint);
  line-height: 1.5;
  margin: 0 0 26px;
}

.note.blocked {
  color: var(--signal-amber, var(--text-faint));
  font-size: 0.88rem;
  line-height: 1.6;
  margin-bottom: 0;
}

button {
  width: 100%;
  padding: 13px;
  background: var(--accent);
  color: var(--ink);
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 600;
  font-size: 0.95rem;
}

button:disabled {
  opacity: 0.6;
}
</style>
