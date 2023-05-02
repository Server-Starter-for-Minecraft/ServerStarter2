<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();
</script>

<template>
  <!-- TODO: drawerの定義をここで書き、drawerの中身はStoreで受ける -->
  <!-- 画面サイズが小さいときにMenuBtnが表示され、大きいときにはDrawerが固定で表示させる -->

  <q-layout view="hHh Lpr rff">
    <q-header class="header">
      <q-toolbar class="q-pa-lg">
        <q-btn
          v-show="mainStore.showMenuBtn"
          flat
          dense
          round
          @click="mainStore.leftDrawerOpen = !mainStore.leftDrawerOpen"
          aria-label="Menu"
          icon="menu"
          size="20px"
        />

        <q-toolbar-title>
          <span class="title">{{ mainStore.mainTitle }}</span>
          <span>{{ mainStore.subTitle }}</span>
        </q-toolbar-title>

        <div>{{ mainStore.sideText }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="mainStore.leftDrawerOpen"
      :mini="$q.screen.lt.md"
      :width="200"
      :breakpoint="100"
      bordered
      :class="$q.dark.isActive ? 'bg-grey-9' : 'bg-grey-3'"
    >
      <q-list>
        <template v-for="(menuItem, index) in mainStore.drawerContents" :key="index">
          <q-item clickable v-ripple>
            <q-item-section avatar>
              <q-icon :name="menuItem.icon" />
            </q-item-section>
            <q-item-section>
              {{ menuItem.label }}
            </q-item-section>
            <q-tooltip
              v-show="$q.screen.lt.md"
              anchor="center right"
              self="center left"
              :offset="[10, 10]"
              class="text-body1"
            >
              {{ menuItem.label }}
            </q-tooltip>
          </q-item>
          <q-separator :key="'sep' + index"  v-if="menuItem.separator" />
        </template>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<style scoped lang="scss">
.header {
  background-color: #1a1a1a;
  height: 6rem;
}

.title {
  font-size: 24pt;
}
</style>
