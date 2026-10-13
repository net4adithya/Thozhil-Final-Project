<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi } from '../api';

const router = useRouter();
const interns = ref([]);
const loading = ref(true);
const error = ref('');
const search = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    interns.value = await adminApi.listInterns();
  } catch (err) {
    error.value = 'Could not load interns list.';
  } finally {
    loading.value = false;
  }
});

const filteredInterns = computed(() => {
  if (!search.value) return interns.value;
  const q = search.value.toLowerCase();
  return interns.value.filter(
    (i) =>
      i.name.toLowerCase().includes(q) ||
      i.email.toLowerCase().includes(q) ||
      (i.institution && i.institution.toLowerCase().includes(q))
  );
});

function viewDetail(id) {
  router.push(`/interns/${id}`);
}
</script>

<template>
  <div>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-caption text-medium-emphasis">
          <router-link to="/" class="text-decoration-none text-primary font-weight-medium">Dashboard</router-link> / Intern Details
        </div>
        <h1 class="text-h5 font-weight-bold">Intern Details & Profiles</h1>
        <div class="text-subtitle-2 text-medium-emphasis">Search and inspect Intern profiles, active assignments, and multi-stage evaluation histories</div>
      </div>
      <v-btn variant="outlined" prepend-icon="mdi-arrow-left" to="/">Back to Dashboard</v-btn>
    </div>

    <!-- Search Toolbar -->
    <v-card variant="outlined" class="pa-4 mb-6">
      <v-row density="compact" align="center">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            label="Search Intern by name, email or institution..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>
      </v-row>
    </v-card>

    <v-card variant="outlined" class="pa-4">
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-3" />
      <v-alert v-else-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

      <v-table v-else hover density="comfortable">
        <thead>
          <tr>
            <th class="text-left">Intern Name</th>
            <th class="text-left">Email</th>
            <th class="text-left">Institution</th>
            <th class="text-left">Assigned Assessments</th>
            <th class="text-left">Completed</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredInterns.length === 0">
            <td colspan="6" class="text-center text-medium-emphasis py-4">No matching interns found.</td>
          </tr>
          <tr v-for="intern in filteredInterns" :key="intern.id">
            <td class="font-weight-medium">
              <a class="text-primary text-decoration-none cursor-pointer" @click="viewDetail(intern.id)">
                {{ intern.name }}
              </a>
            </td>
            <td>{{ intern.email }}</td>
            <td>{{ intern.institution || 'N/A' }}</td>
            <td><v-chip size="small" variant="tonal" color="info">{{ intern.assignedCount }}</v-chip></td>
            <td><v-chip size="small" variant="tonal" color="success">{{ intern.completedCount }}</v-chip></td>
            <td class="text-right">
              <v-btn size="small" variant="flat" color="primary" @click="viewDetail(intern.id)">
                View Intern Profile
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>

