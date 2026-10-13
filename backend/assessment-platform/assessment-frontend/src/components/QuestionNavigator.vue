<script setup>
defineProps({
  questions: { type: Array, required: true },
  currentIndex: { type: Number, required: true },
  answeredIds: { type: Object, required: true }, // Set of question ids
});
const emit = defineEmits(['select']);
</script>

<template>
  <nav class="navigator" aria-label="Question navigator">
    <button
      v-for="(q, i) in questions"
      :key="q._id"
      class="pill"
      :class="{
        active: i === currentIndex,
        answered: answeredIds.has(q._id),
      }"
      :aria-current="i === currentIndex ? 'true' : undefined"
      @click="emit('select', i)"
    >
      {{ i + 1 }}
    </button>
  </nav>
</template>

<style scoped>
.navigator {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(38px, 1fr));
  gap: 8px;
}

.pill {
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text-muted);
  font-family: var(--font-mono);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.pill:hover {
  border-color: var(--accent-dim);
  color: var(--text);
}

.pill.answered {
  border-color: var(--signal-green);
  color: var(--signal-green);
}

.pill.active {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--ink);
  font-weight: 600;
}
</style>
