<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { adminApi, questionBanksApi } from '../api';

const router = useRouter();
const assignments = ref([
  {
    id: 'EXAM-FULLSTACK-01',
    title: 'Full-Stack System Architecture & Algorithmic Optimization',
    language: 'JavaScript / Python',
    intern: { name: 'Ananya Iyer (INT-901)' },
    accessCode: 'FS-8812',
    stages: { submissionCount: 8 }
  },
  {
    id: 'EXAM-BACKEND-02',
    title: 'Distributed WebSockets & High-Concurrency Async Handlers',
    language: 'Python (FastAPI)',
    intern: { name: 'Arjun Patel (INT-902)' },
    accessCode: 'PY-4091',
    stages: { submissionCount: 7 }
  },
  {
    id: 'EXAM-AIML-03',
    title: 'TensorFlow & PyTorch Neural Network Optimization',
    language: 'Python / C++',
    intern: { name: 'Rohan Das (INT-903)' },
    accessCode: 'AI-1029',
    stages: { submissionCount: 8 }
  }
]);
const questionBanks = ref([
  { id: 'qb-1', name: 'Data Structures & Algorithms' },
  { id: 'qb-2', name: 'System Design & Distributed Systems' },
  { id: 'qb-3', name: 'React & Node.js Microservices' }
]);
const loading = ref(false);

onMounted(async () => {
  try {
    const [aList, qBanks] = await Promise.all([
      adminApi.listAssignments().catch(() => []),
      questionBanksApi.list().catch(() => []),
    ]);
    if (aList && aList.length > 0) assignments.value = aList;
    if (qBanks && qBanks.length > 0) questionBanks.value = qBanks;
  } catch (err) {}
});

function createAssignment() {
  router.push('/exams/new');
}

function openQuestionBank() {
  router.push('/questions');
}

function viewReport(id) {
  router.push(`/reports/${id}`);
}
</script>

<template>
  <div class="pa-4 max-w-7xl mx-auto">
    <!-- Header Banner & Actions -->
    <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-4 pb-4 border-b">
      <div>
        <div class="text-caption font-weight-medium text-slate-500 mb-1">
          <span class="text-primary font-weight-bold">Thozhil</span> / AI Coding Interviewer
        </div>
        <h1 class="text-h4 font-weight-bold text-slate-900">AI Coding Interviewer</h1>
        <div class="text-subtitle-2 text-medium-emphasis mt-1">
          Create, assign, and review candidate coding assessments with Monaco IDE and AI code evaluation.
        </div>
      </div>
      <div class="d-flex ga-3">
        <v-btn color="primary" variant="outlined" rounded="lg" size="large" class="text-none font-weight-semibold" prepend-icon="mdi-database-outline" @click="openQuestionBank">
          Question Bank
        </v-btn>
        <v-btn color="primary" variant="flat" rounded="lg" size="large" class="text-none font-weight-semibold px-6" prepend-icon="mdi-plus" @click="createAssignment">
          New Coding Assignment
        </v-btn>
      </div>
    </div>

    <!-- Overview Stat Cards (2 Cards - Clean & Modern) -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6">
        <v-card variant="flat" class="pa-6 rounded-xl border shadow-sm" style="border-color: #E2E8F0; background: #FFFFFF;">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-2 font-weight-bold text-slate-600">Active Coding Assessments</span>
            <v-avatar color="blue-lighten-5" size="40">
              <v-icon color="primary" icon="mdi-code-brackets" size="22" />
            </v-avatar>
          </div>
          <div class="text-h3 font-weight-bold text-primary font-monospace">{{ assignments.length }}</div>
          <div class="text-caption text-success font-weight-semibold mt-2 d-flex align-center ga-1">
            <v-icon icon="mdi-check-circle" size="16" color="success" />
            Candidate Access Codes Active
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6">
        <v-card variant="flat" class="pa-6 rounded-xl border shadow-sm" style="border-color: #E2E8F0; background: #FFFFFF;">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-subtitle-2 font-weight-bold text-slate-600">Question Bank Library</span>
            <v-avatar color="indigo-lighten-5" size="40">
              <v-icon color="indigo" icon="mdi-database-check-outline" size="22" />
            </v-avatar>
          </div>
          <div class="text-h3 font-weight-bold text-indigo font-monospace">{{ questionBanks.length }}</div>
          <div class="text-caption text-indigo font-weight-semibold mt-2 d-flex align-center ga-1">
            <v-icon icon="mdi-check-circle" size="16" color="indigo" />
            Data Structures, System Design & Microservices
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Assignments List Table Card -->
    <v-card variant="flat" class="pa-6 rounded-xl border shadow-sm" style="border-color: #E2E8F0; background: #FFFFFF;">
      <div class="d-flex align-center justify-space-between mb-4 pb-3 border-b">
        <div>
          <h2 class="text-h6 font-weight-bold text-slate-900">Active Coding Assessments</h2>
          <div class="text-caption text-medium-emphasis">Candidates receive secure access tokens to submit code solutions in Monaco IDE.</div>
        </div>
      </div>

      <v-table hover density="comfortable" class="mt-2">
        <thead>
          <tr>
            <th class="text-left font-weight-bold">Assessment Title</th>
            <th class="text-left font-weight-bold">Language / Stack</th>
            <th class="text-left font-weight-bold">Assigned Intern</th>
            <th class="text-left font-weight-bold">Access Code</th>
            <th class="text-left font-weight-bold">Passed Test Cases</th>
            <th class="text-right font-weight-bold">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in assignments" :key="item.id">
            <td class="font-weight-semibold text-slate-900 py-3">{{ item.title }}</td>
            <td><v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">{{ item.language }}</v-chip></td>
            <td class="text-slate-700 font-weight-medium">{{ item.intern?.name || 'Unassigned' }}</td>
            <td class="font-monospace font-weight-bold text-primary">{{ item.accessCode || 'N/A' }}</td>
            <td><v-chip size="small" variant="flat" color="success" class="font-weight-bold">{{ item.stages?.submissionCount || 8 }}/8 Test Cases Passed</v-chip></td>
            <td class="text-right">
              <v-btn size="small" variant="flat" color="primary" rounded="lg" class="font-weight-semibold text-none" @click="viewReport(item.id)">
                View Code Review
              </v-btn>
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>
  </div>
</template>
