<script setup>
defineProps({
  label: { type: String, required: true },
  severity: { type: String, default: 'normal' }, // normal | warning | critical
});
</script>

<template>
  <div class="timer-chip" :class="severity" role="timer" aria-live="polite">
    <span class="dot" />
    <span class="time">{{ label }}</span>
  </div>
</template>

<style scoped>
.timer-chip {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px 8px 14px;
  background: var(--panel-raised);
  border: 1px solid var(--border);
  border-left: 4px solid var(--signal-green);
  border-radius: var(--radius-sm);
  font-family: var(--font-display);
  transition: border-left-color 0.4s ease;
}

.timer-chip.warning {
  border-left-color: var(--signal-amber);
}

.timer-chip.critical {
  border-left-color: var(--signal-red);
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--signal-green);
  transition: background 0.4s ease;
}

.warning .dot {
  background: var(--signal-amber);
}

.critical .dot {
  background: var(--signal-red);
  animation: pulse 1s ease-in-out infinite;
}

.time {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 0.02em;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.4;
    transform: scale(0.75);
  }
}
</style>
