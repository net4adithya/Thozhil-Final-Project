<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  multiline: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue']);
</script>

<template>
  <textarea
    v-if="multiline"
    class="answer-input"
    :value="modelValue"
    placeholder="Type your answer here..."
    rows="8"
    @input="emit('update:modelValue', $event.target.value)"
  />
  <input
    v-else
    class="answer-input single-line"
    type="text"
    :value="modelValue"
    placeholder="Type your answer here..."
    @input="emit('update:modelValue', $event.target.value)"
  />
</template>

<style scoped>
.answer-input {
  width: 100%;
  margin-top: 20px;
  padding: 14px 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 0.95rem;
  line-height: 1.5;
  resize: vertical;
}

.answer-input:focus {
  border-color: var(--accent);
}

.single-line {
  height: 46px;
}
</style>
