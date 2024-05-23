import { RouteRecordRaw } from 'vue-router';
import ConsolePage from 'src/pages/WorldTabs/ConsolePage.vue';

// preLoadをすることでHOMEの表示中にコンポーネントの読み込みを並列する
const preLoad = (module: any) => () => module;

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: preLoad(import('src/pages/WorldTabs/HomePage.vue')),
      },
      // consoleページはタブが開かれる前にWorldTabから呼び出されることがあるため、先に読み込んでおく
      { path: 'console', component: ConsolePage },
      {
        path: 'property',
        component: preLoad(import('src/pages/WorldTabs/PropertyPage.vue')),
      },
      {
        path: 'player',
        component: preLoad(import('src/pages/WorldTabs/PlayerPage.vue')),
      },
      {
        path: 'contents',
        component: preLoad(import('src/pages/WorldTabs/ContentsPage.vue')),
      },
      {
        path: 'share-world',
        component: preLoad(import('src/pages/WorldTabs/ShareWorldPage.vue')),
      },
      {
        path: 'others',
        component: preLoad(import('src/pages/WorldTabs/OthersPage.vue')),
      },

      {
        path: 'system/',
        component: preLoad(import('pages/SystemPage.vue')),
        children: [
          {
            path: '',
            component: preLoad(
              import('src/pages/SystemSettings/GeneralPage.vue')
            ),
          },
          {
            path: 'property',
            component: preLoad(
              import('src/pages/SystemSettings/PropertyPage.vue')
            ),
          },
          {
            path: 'remote',
            component: preLoad(
              import('src/pages/SystemSettings/RemotePage.vue')
            ),
          },
          {
            path: 'folder',
            component: preLoad(
              import('src/pages/SystemSettings/FolderPage.vue')
            ),
          },
          {
            path: 'info',
            component: preLoad(import('src/pages/SystemSettings/InfoPage.vue')),
          },
        ],
      },
    ],
  },
  {
    path: '/init',
    component: () => import('pages/InitPage.vue'),
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
