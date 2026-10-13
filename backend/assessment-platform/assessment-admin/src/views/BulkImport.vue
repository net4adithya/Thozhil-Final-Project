<script setup>
import { ref } from 'vue';
import { questionsApi } from '../api';

const fileInput = ref(null);
const preview = ref(null);
const loading = ref(false);
const importing = ref(false);
const error = ref('');
const result = ref(null);

const headers = [
  { title: 'Row', key: 'row', width: 70 },
  { title: 'Title', key: 'title' },
  { title: 'Type', key: 'type' },
  { title: 'Group', key: 'group' },
  { title: 'Issues', key: 'issues' },
];

async function onFileChange(e) {
  const file = e.target.files[0];
  if (!file) return;
  loading.value = true;
  error.value = '';
  preview.value = null;
  result.value = null;
  try {
    preview.value = await questionsApi.previewImport(file);
  } catch (err) {
    error.value = err.response?.data?.message || 'Could not read that file.';
  } finally {
    loading.value = false;
  }
}

async function confirmImport() {
  const validRows = preview.value.rows.filter((r) => r.errors.length === 0);
  if (validRows.length === 0) return;
  importing.value = true;
  error.value = '';
  try {
    result.value = await questionsApi.confirmImport(validRows.map((r) => r.data));
    preview.value = null;
  } catch (err) {
    error.value = err.response?.data?.message || 'Import failed.';
  } finally {
    importing.value = false;
  }
}

function reset() {
  preview.value = null;
  result.value = null;
  error.value = '';
  if (fileInput.value) fileInput.value.value = '';
}
</script>

<template>
  <h1 class="text-h5 font-weight-bold mb-6">Bulk import questions</h1>

  <v-card class="pa-6 mb-6">
    <p class="text-body-2 text-medium-emphasis mb-4">
      Upload a <strong>.csv</strong>, <strong>.xlsx</strong>, or <strong>.json</strong> file.
      Columns/fields: <code>type, title, statement, constraints, marks, negativeMarks,
      difficulty, tags, group, media, options, correctOptions, expectedAnswer,
      testCaseInputs, testCaseOutputs, testCaseHidden, allowedLanguages, languageVersion,
      timeLimitMs, memoryLimitKb</code>. In CSV/XLSX, pipe-separate multi-value cells (e.g.
      <code>options: Paris|London|Berlin</code>, <code>correctOptions: 1</code> as a
      1-based index). JSON files may use real arrays instead — either an array of rows,
      or <code>{ "questions": [...] }</code>, and <code>options</code> may be full
      <code>{ text, isCorrect }</code> objects.
    </p>
    <p class="text-body-2 text-medium-emphasis mb-4">
      <strong>group</strong> is an optional free-text label (e.g. <code>Python Basics Set 1</code>) —
      give the same value to every question that belongs together, and you can add all of
      them to an exam in one click from the exam editor's "Add all questions from a group"
      picker, instead of adding each one individually.
      <strong>media</strong> attaches images/videos to a question, pipe-separated as
      <code>image:&lt;url&gt;</code> or <code>video:&lt;url&gt;</code> pairs, e.g.
      <code>image:https://example.com/diagram.png</code>.
      <strong>languageVersion</strong> (coding questions) accepts one bare value applied
      to every allowed language (e.g. <code>3.12.0</code>, or <code>latest</code>), or
      per-language pairs when different languages need different runtimes, e.g.
      <code>python:3.12.0|javascript:18.15.0</code>. If you edit the file in Excel/Sheets,
      set that column's format to <strong>Text</strong> first — otherwise a version like
      <code>3.12</code> can get silently auto-converted into a date and imported as
      garbage (you'll get a clear import error if that happens, instead of a mysterious
      "runtime unknown" later when a candidate runs code).
    </p>
    <v-file-input
      ref="fileInput"
      label="Choose a file"
      accept=".csv,.xlsx,.xls,.json,application/json"
      prepend-icon="mdi-tray-arrow-up"
      density="comfortable"
      hide-details
      @change="onFileChange"
    />
  </v-card>

  <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
  <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

  <div v-if="preview">
    <div class="d-flex ga-4 mb-4 text-body-2">
      <span>{{ preview.summary.total }} rows</span>
      <span class="text-success">{{ preview.summary.valid }} valid</span>
      <span v-if="preview.summary.invalid" class="text-error">{{ preview.summary.invalid }} with errors</span>
    </div>

    <v-data-table :headers="headers" :items="preview.rows" item-value="row" density="comfortable" class="mb-4">
      <template #item.title="{ item }">{{ item.data.title || '—' }}</template>
      <template #item.type="{ item }">{{ item.data.type || '—' }}</template>
      <template #item.group="{ item }">{{ item.data.group || '—' }}</template>
      <template #item.issues="{ item }">
        <span v-if="item.errors.length === 0" class="text-success">Ready to import</span>
        <ul v-else class="text-error pl-4 my-0">
          <li v-for="(e, i) in item.errors" :key="i">{{ e }}</li>
        </ul>
      </template>
    </v-data-table>

    <div class="d-flex ga-3">
      <v-btn variant="outlined" @click="reset">Cancel</v-btn>
      <v-btn
        color="primary"
        :loading="importing"
        :disabled="preview.summary.valid === 0"
        @click="confirmImport"
      >
        Import {{ preview.summary.valid }} valid question(s)
      </v-btn>
    </div>
  </div>

  <v-card v-if="result" class="pa-6 mt-6 d-flex align-center ga-4 flex-wrap">
    <span class="text-success">Imported {{ result.createdCount }} question(s).</span>
    <span v-if="result.failed?.length" class="text-error">{{ result.failed.length }} failed to save.</span>
    <v-btn variant="outlined" @click="reset">Import another file</v-btn>
    <v-btn color="primary" to="/questions">View question bank</v-btn>
  </v-card>
</template>