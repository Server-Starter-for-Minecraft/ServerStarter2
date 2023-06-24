import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/WorldTabs/HomePage.vue') },
      { path: 'console', component: () => import('src/pages/WorldTabs/ConsolePage.vue') },
      { path: 'property', component: () => import('src/pages/WorldTabs/PropertyPage.vue') },
      { path: 'player', component: () => import('src/pages/WorldTabs/PlayerPage.vue') },
      { path: 'datapack', component: () => import('src/pages/WorldTabs/DatapackPage.vue') },
      { path: 'plugin', component: () => import('src/pages/WorldTabs/PluginPage.vue') },
      { path: 'mod', component: () => import('src/pages/WorldTabs/ModPage.vue') },
      { path: 'share-world', component: () => import('src/pages/WorldTabs/ShareWorldPage.vue') },

      {
        path: 'system/',
        component: () => import('pages/SystemPage.vue'),
        children: [
          { path: '', component: () => import('src/pages/SystemSettings/GeneralPage.vue') },
          { path: 'property', component: () => import('src/pages/SystemSettings/PropertyPage.vue') },
          { path: 'remote', component: () => import('src/pages/SystemSettings/RemotePage.vue') },
        ]
      }
    ]
  },
  {
    path: '/init',
    component: () => import('pages/InitPage.vue')
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
