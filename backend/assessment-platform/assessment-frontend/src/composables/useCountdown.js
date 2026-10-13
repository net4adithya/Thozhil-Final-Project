import { ref, computed, onBeforeUnmount } from 'vue';

/**
 * Drives the exam countdown. `endsAt` is an absolute Date computed once from
 * server-provided startedAt + durationMinutes, so the timer survives page
 * refreshes and can't be extended by fiddling with client clock/localStorage.
 */
export function useCountdown(endsAt, onExpire) {
  const now = ref(Date.now());
  let intervalId = null;

  const remainingMs = computed(() => Math.max(0, endsAt.getTime() - now.value));
  const remainingSeconds = computed(() => Math.floor(remainingMs.value / 1000));

  const label = computed(() => {
    const s = remainingSeconds.value;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  });

  // Thresholds tuned for a typical 30–120 min exam: calm until 10 min left, then it matters.
  const severity = computed(() => {
    if (remainingSeconds.value <= 60) return 'critical';
    if (remainingSeconds.value <= 600) return 'warning';
    return 'normal';
  });

  let expired = false;
  intervalId = setInterval(() => {
    now.value = Date.now();
    if (!expired && remainingMs.value <= 0) {
      expired = true;
      clearInterval(intervalId);
      onExpire?.();
    }
  }, 1000);

  onBeforeUnmount(() => clearInterval(intervalId));

  return { remainingMs, remainingSeconds, label, severity };
}
