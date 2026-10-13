<script setup>
import { ref, onMounted, watch } from 'vue';
import { questionsApi } from '../api';

const questions = ref([]);
const total = ref(0);
const search = ref('');
const type = ref(null);
const group = ref(null);
const groups = ref([]);
const loading = ref(false);
const selected = ref([]);
const exporting = ref(false);

const typeOptions = [
  { title: 'All types', value: null },
  { title: 'MCQ', value: 'mcq' },
  { title: 'Multi-select', value: 'multi_select' },
  { title: 'True/False', value: 'true_false' },
  { title: 'Fill in the blank', value: 'fill_blank' },
  { title: 'Subjective', value: 'subjective' },
  { title: 'Coding', value: 'coding' },
  { title: 'File upload', value: 'file_upload' },
];

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Type', key: 'type' },
  { title: 'Difficulty', key: 'difficulty' },
  { title: 'Marks', key: 'marks', align: 'end' },
  { title: '', key: 'actions', align: 'end', sortable: false },
];

onMounted(load);
onMounted(async () => {
  try {
    groups.value = await questionsApi.listGroups();
  } catch {
    // Non-critical — the group filter just stays empty.
  }
});
let debounceId;
watch([search, type, group], () => {
  clearTimeout(debounceId);
  debounceId = setTimeout(load, 300);
});

async function load() {
  loading.value = true;
  try {
    const params = {};
    if (search.value) params.search = search.value;
    if (type.value) params.type = type.value;
    if (group.value) params.group = group.value;
    const res = await questionsApi.list(params);
    questions.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

async function remove(id) {
  if (!window.confirm('Delete this question? This cannot be undone.')) return;
  await questionsApi.remove(id);
  load();
}

async function exportBank(format) {
  exporting.value = true;
  try {
    const filters = {};
    if (selected.value.length) filters.ids = selected.value.join(',');
    else {
      if (search.value) filters.search = search.value;
      if (type.value) filters.type = type.value;
    }
    await questionsApi.exportQuestions(format, filters);
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-3">
    <h1 class="text-h5 font-weight-bold">Question bank</h1>
    <div class="d-flex ga-2">
      <v-menu>
        <template #activator="{ props: menuProps }">
          <v-btn variant="outlined" prepend-icon="mdi-download" :loading="exporting" v-bind="menuProps">
            Export{{ selected.length ? ` (${selected.length})` : '' }}
          </v-btn>
        </template>
        <v-list density="compact">
          <v-list-item title="Export as .xlsx" @click="exportBank('xlsx')" />
          <v-list-item title="Export as .csv" @click="exportBank('csv')" />
        </v-list>
      </v-menu>
      <v-btn variant="outlined" prepend-icon="mdi-tray-arrow-up" to="/questions/import">Bulk import</v-btn>
      <v-btn color="primary" prepend-icon="mdi-plus" to="/questions/new">New question</v-btn>
    </div>
  </div>

  <div class="d-flex ga-3 mb-4">
    <v-text-field v-model="search" placeholder="Search by title…" prepend-inner-icon="mdi-magnify" hide-details clearable />
    <v-select v-model="type" :items="typeOptions" hide-details style="max-width: 220px" />
    <v-select
      v-model="group"
      :items="[{ title: 'All groups', value: null }, ...groups.map((g) => ({ title: `${g.group} (${g.count})`, value: g.group }))]"
      hide-details
      style="max-width: 220px"
      clearable
    />
  </div>

  <v-data-table
    v-model="selected"
    :headers="headers"
    :items="questions"
    :loading="loading"
    item-value="_id"
    show-select
    density="comfortable"
  >
    <template #item.title="{ item }">
      <router-link class="text-decoration-none font-weight-medium" style="color: inherit" :to="`/questions/${item._id}`">
        {{ item.title }}
      </router-link>
    </template>
    <template #item.type="{ item }">
      <v-chip size="small" variant="tonal">{{ item.type.replace('_', ' ') }}</v-chip>
    </template>
    <template #item.actions="{ item }">
      <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" @click="remove(item._id)" />
    </template>
    <template #no-data>
      <div class="text-medium-emphasis pa-4">No questions match.</div>
    </template>
  </v-data-table>
</template>
