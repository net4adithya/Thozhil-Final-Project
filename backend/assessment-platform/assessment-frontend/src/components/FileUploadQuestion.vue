<script setup>
import { ref } from 'vue';
import examApi from '../api/examApi';

const props = defineProps({
  token: { type: String, required: true },
  questionId: { type: String, required: true },
  modelValue: { type: Object, default: () => ({ fileUrl: '', originalName: '' }) },
});
const emit = defineEmits(['update:modelValue']);

const uploading = ref(false);
const error = ref('');
const fileInput = ref(null);

async function onFileSelected(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  uploading.value = true;
  error.value = '';
  try {
    const result = await examApi.uploadAnswerFile(props.token, { questionId: props.questionId, file });
    emit('update:modelValue', { fileUrl: result.fileUrl, originalName: result.originalName });
  } catch (err) {
    error.value = err.response?.data?.message || 'Upload failed. Please try again.';
  } finally {
    uploading.value = false;
    if (fileInput.value) fileInput.value.value = '';
  }
}
</script>

<template>
  <div class="file-upload">
    <label class="dropzone" :class="{ busy: uploading }">
      <input ref="fileInput" type="file" @change="onFileSelected" :disabled="uploading" />
      <span v-if="uploading">Uploading…</span>
      <span v-else-if="modelValue.originalName">Replace file (currently: {{ modelValue.originalName }})</span>
      <span v-else>Click to choose a file to upload</span>
    </label>
    <p v-if="modelValue.originalName && !uploading" class="uploaded">
      ✓ Uploaded: {{ modelValue.originalName }}
    </p>
    <p v-if="error" class="upload-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.file-upload {
  margin-top: 20px;
}
.dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  background: var(--panel);
  color: var(--text-muted);
  font-size: 0.9rem;
  cursor: pointer;
  text-align: center;
}
.dropzone.busy {
  opacity: 0.7;
  cursor: default;
}
.dropzone input {
  display: none;
}
.uploaded {
  margin-top: 10px;
  font-size: 0.85rem;
  color: var(--signal-green);
}
.upload-error {
  margin-top: 10px;
  font-size: 0.85rem;
  color: var(--signal-red);
}
</style>
