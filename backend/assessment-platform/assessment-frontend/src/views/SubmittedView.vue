<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

defineProps({ token: String });
const route = useRoute();
const reason = computed(() => route.query.reason);
const isBanned = computed(() => !!reason.value || route.query.banned === 'true');
</script>

<template>
  <div class="wrap">
    <div class="card" :class="{ 'card-banned': isBanned }">
      <div class="check" :class="{ 'check-banned': isBanned }">{{ isBanned ? '⛔' : '✓' }}</div>
      <h1>{{ isBanned ? 'EXAM TERMINATED & BANNED' : 'Submitted' }}</h1>
      <p v-if="isBanned" class="banned-msg">
        Your exam attempt has been terminated and <strong>permanently banned</strong> due to security violations
        <span v-if="reason"> (Detected: <code>{{ reason }}</code>)</span>.
        <br /><br />
        You cannot attempt this assessment again.
      </p>
      <p v-else>Your answers have been recorded. You can close this window now.</p>
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
  text-align: center;
  max-width: 460px;
  width: 100%;
  padding: 40px 32px;
  background: var(--panel, #ffffff);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: var(--radius-md, 12px);
}

.card-banned {
  border-color: #ef4444;
  background: #fef2f2;
}

.check {
  width: 64px;
  height: 64px;
  margin: 0 auto 20px;
  border-radius: 50%;
  background: rgba(63, 182, 139, 0.15);
  color: var(--signal-green, #16a34a);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.check-banned {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}

h1 {
  font-family: var(--font-display);
  margin: 0 0 14px;
  font-size: 1.6rem;
}

p {
  color: var(--text-muted, #475569);
  line-height: 1.6;
}

.banned-msg {
  color: #991b1b;
  font-size: 0.95rem;
}

code {
  background: rgba(239, 68, 68, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: var(--font-mono, monospace);
}
</style>
