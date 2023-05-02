import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/MainPage.vue') },
      { path: 'progress', component: () => import('src/pages/ProgressPage.vue') },
      { path: 'console', component: () => import('src/pages/ConsolePage.vue') },
      { path: 'settings', component: () => import('src/pages/SettingsPage.vue') },
      {
        path: 'world-edit',
        component: () => import('src/pages/WorldEditPage.vue'),
        children: [
          { path: '', component: () => import('src/components/WorldEdit/GeneralVue.vue') },
          { path: 'property', component: () => import('src/components/WorldEdit/PropertyVue.vue') },
          { path: 'person', component: () => import('src/components/WorldEdit/PersonListVue.vue') },
          { path: 'additional', component: () => import('src/components/WorldEdit/AdditionalVue.vue') },
          { path: 'share-world', component: () => import('src/components/WorldEdit/ShareWorld.vue') },
        ]
      },
    ]
  },
  {
    path: '/error',
    component: () => import('pages/ErrorPage.vue'),
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
