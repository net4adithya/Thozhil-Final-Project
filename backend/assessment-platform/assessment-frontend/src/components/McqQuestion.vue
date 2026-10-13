<script setup>
import { computed } from 'vue';

const props = defineProps({
  question: { type: Object, required: true },
  modelValue: { type: Array, default: () => [] }, // selected option ids
});
const emit = defineEmits(['update:modelValue']);

const isMulti = computed(() => props.question.type === 'multi_select');

function toggle(optionId) {
  if (isMulti.value) {
    const set = new Set(props.modelValue);
    set.has(optionId) ? set.delete(optionId) : set.add(optionId);
    emit('update:modelValue', [...set]);
  } else {
    emit('update:modelValue', [optionId]);
  }
}

function isChecked(optionId) {
  return props.modelValue.includes(optionId);
}
</script>

<template>
  <div class="options" role="group" :aria-label="question.title">
    <label
      v-for="opt in question.options"
      :key="opt._id"
      class="option"
      :class="{ checked: isChecked(opt._id) }"
    >
      <input
        :type="isMulti ? 'checkbox' : 'radio'"
        :name="question._id"
        :checked="isChecked(opt._id)"
        @change="toggle(opt._id)"
      />
      <span class="mark" :class="{ round: !isMulti }" />
      <span class="text">{{ opt.text }}</span>
    </label>
  </div>
</template>

<style scoped>
.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
}

.option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.option:hover {
  border-color: var(--accent-dim);
}

.option.checked {
  border-color: var(--accent);
  background: var(--panel-raised);
}

.option input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.mark {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border: 2px solid var(--text-faint);
  border-radius: 4px;
}

.mark.round {
  border-radius: 50%;
}

.checked .mark {
  border-color: var(--accent);
  background: var(--accent);
  box-shadow: inset 0 0 0 3px var(--panel);
}

.text {
  font-size: 0.95rem;
  line-height: 1.4;
}
</style>
