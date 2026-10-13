<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const tokenInput = ref('');

function go() {
  const trimmed = tokenInput.value.trim();
  if (!trimmed) return;
  // Accept either a bare token or a full pasted link ending in /exam/<token>
  const token = trimmed.includes('/') ? trimmed.split('/').filter(Boolean).pop() : trimmed;
  router.push({ name: 'exam', params: { token } });
}
</script>

<template>
  <div class="wrap">
    <div class="card">
      <div class="eyebrow">Intern Portal • Assessment Access</div>
      <h1>Enter Access Code</h1>
      <p class="sub">Enter the 6-character access code or paste the exam link provided by your recruiter.</p>
      <form @submit.prevent="go">
        <input
          v-model="tokenInput"
          type="text"
          placeholder="e.g. A1B2C3"
          autocomplete="off"
          autofocus
          class="code-input"
        />
        <button type="submit">Start Assessment</button>
      </form>
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
  font-size: 1.6rem;
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
</style>
