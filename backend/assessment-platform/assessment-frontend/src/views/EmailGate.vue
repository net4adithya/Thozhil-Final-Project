<script setup>
import { ref } from 'vue';

const props = defineProps({
  verifying: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
const emit = defineEmits(['confirm']);

const email = ref('');

function submit() {
  const trimmed = email.value.trim();
  if (!trimmed || props.verifying) return;
  emit('confirm', trimmed);
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <div class="eyebrow">Confirm your identity</div>
      <h1>Confirm your email to continue</h1>
      <p class="sub">
        Type the email address this exam invite was sent to. This just makes sure the
        right person is starting the exam.
      </p>
      <form @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          autofocus
        />
        <button type="submit" :disabled="verifying">
          {{ verifying ? 'Checking…' : 'Continue' }}
        </button>
      </form>
      <p v-if="error" class="err">{{ error }}</p>
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
  max-width: 440px;
  padding: 40px;
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
  margin-bottom: 10px;
}

h1 {
  font-family: var(--font-display);
  font-size: 1.5rem;
  margin: 0 0 10px;
}

.sub {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0 0 26px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

input {
  padding: 13px 14px;
  background: var(--ink);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

input:focus {
  border-color: var(--accent);
}

button {
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

.err {
  margin: 14px 0 0;
  color: var(--signal-red);
  font-size: 0.82rem;
  line-height: 1.4;
}
</style>
