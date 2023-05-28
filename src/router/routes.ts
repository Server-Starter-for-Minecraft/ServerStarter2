import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('src/pages/WorldTabs/HomePage.vue') },
      { path: 'console', component: () => import('src/pages/WorldTabs/ConsolePage.vue') },
      {
        path: 'property',
        component: () => import('src/pages/WorldTabs/PropertyPage.vue'),
        children: [
          { path: '', component: () => import('src/pages/WorldTabs/PropertyPages/GeneralPage.vue') },
          { path: 'player', component: () => import('src/pages/WorldTabs/PropertyPages/PlayerPage.vue') },
          { path: 'server', component: () => import('src/pages/WorldTabs/PropertyPages/ServerPage.vue') },
          { path: 'generater', component: () => import('src/pages/WorldTabs/PropertyPages/GeneraterPage.vue') },
          { path: 'spawning', component: () => import('src/pages/WorldTabs/PropertyPages/SpawningPage.vue') },
          { path: 'world', component: () => import('src/pages/WorldTabs/PropertyPages/WorldPage.vue') },
          { path: 'network', component: () => import('src/pages/WorldTabs/PropertyPages/NetworkPage.vue') },
          { path: 'rcon-query', component: () => import('src/pages/WorldTabs/PropertyPages/RconQueryPage.vue') },
          { path: 'command', component: () => import('src/pages/WorldTabs/PropertyPages/CommandPage.vue') },
          { path: 'resourcepack', component: () => import('src/pages/WorldTabs/PropertyPages/ResourcepackPage.vue') },
          { path: 'security', component: () => import('src/pages/WorldTabs/PropertyPages/SecurityPage.vue') },
          { path: 'other', component: () => import('src/pages/WorldTabs/PropertyPages/OtherPage.vue') },
        ]
      },
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
