import { createRouter, createWebHistory } from 'vue-router';
import TokenEntry from '../views/TokenEntry.vue';
import ExamView from '../views/ExamView.vue';
import SubmittedView from '../views/SubmittedView.vue';

const routes = [
  { path: '/', name: 'token-entry', component: TokenEntry },
  { path: '/exam/:token', name: 'exam', component: ExamView, props: true },
  { path: '/exam/:token/submitted', name: 'submitted', component: SubmittedView, props: true },
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
