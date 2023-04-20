import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/MainPage.vue') },
      { path: 'progress', component: () => import('src/pages/ProgressPage.vue') },
      { path: 'console', component: () => import('src/pages/ConsolePage.vue') },
      { path: 'new-world', component: () => import('src/pages/NewWorldPage.vue') },
      { path: 'world-edit', component: () => import('src/pages/WorldEditPage.vue') },
      { path: 'settings', component: () => import('src/pages/SettingsPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
