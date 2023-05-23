import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'home', component: () => import('src/pages/WorldTabs/HomePage.vue') },
      { path: 'console', component: () => import('src/pages/WorldTabs/ConsolePage.vue') },
      { path: 'property', component: () => import('src/pages/WorldTabs/PropertyPage.vue') },
      { path: 'player', component: () => import('src/pages/WorldTabs/PlayerPage.vue') },
      { path: 'contents', component: () => import('src/pages/WorldTabs/ContentsPage.vue') },
      { path: 'share-world', component: () => import('src/pages/WorldTabs/ShareWorldPage.vue') },
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
