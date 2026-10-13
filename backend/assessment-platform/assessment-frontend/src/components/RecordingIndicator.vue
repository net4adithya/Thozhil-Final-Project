<script setup>
import { computed } from 'vue';

const props = defineProps({
  webcamRequired: { type: Boolean, default: false },
  webcamGranted: { type: Boolean, default: false },
  screenRequired: { type: Boolean, default: false },
  screenGranted: { type: Boolean, default: false },
});

// Nothing to show at all if this exam doesn't require either stream.
const show = computed(() => props.webcamRequired || props.screenRequired);

// If a required stream isn't currently granted (denied up front, or lost mid-exam —
// e.g. the candidate closed the screen-share picker), surface that clearly instead of
// claiming "Recording" when nothing is actually being captured right now.
const interrupted = computed(
  () =>
    (props.webcamRequired && !props.webcamGranted) ||
    (props.screenRequired && !props.screenGranted)
);

const activeParts = computed(() => {
  const parts = [];
  if (props.webcamRequired && props.webcamGranted) parts.push('Webcam');
  if (props.screenRequired && props.screenGranted) parts.push('Screen');
  return parts;
});

const label = computed(() => (interrupted.value ? 'Recording interrupted' : 'Recording'));
const detail = computed(() => (interrupted.value ? 'Reconnect to continue' : activeParts.value.join(' + ')));
</script>

<template>
  <div
    v-if="show"
    class="rec-indicator"
    :class="{ warn: interrupted }"
    title="This session is proctored — webcam/screen footage is recorded for exam integrity."
  >
    <span class="dot" />
    <span class="text">
      <span class="label">{{ label }}</span>
      <span v-if="detail" class="detail">{{ detail }}</span>
    </span>
  </div>
</template>

<style scoped>
.rec-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--panel);
  border: 1px solid var(--border);
  cursor: help;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--signal-red);
  animation: rec-pulse 1.6s ease-in-out infinite;
  flex-shrink: 0;
}

.rec-indicator.warn .dot {
  background: var(--signal-amber, #e8a33d);
  animation: none;
}

.text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--signal-red);
}

.rec-indicator.warn .label {
  color: var(--signal-amber, #e8a33d);
}

.detail {
  font-size: 0.68rem;
  color: var(--text-muted);
}

@keyframes rec-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
</style>
