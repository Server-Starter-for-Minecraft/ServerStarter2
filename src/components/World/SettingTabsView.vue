<script setup lang="ts">
import { ref } from 'vue';
import IconTabsView from './utils/IconTabsView.vue';
import DropBtnView from './utils/dropBtnView.vue';

const tab = ref('home')
</script>

<template>
  <q-tabs
    v-model="tab"
    inline-label
    align="left"
    dense
    outside-arrows
    indicator-color="primary"
    class="fit q-px-sm"
    style="flex: 1 1 0;"
  >
    <icon-tabs-view name="home" icon="home" label="ホーム" to="" />
    <icon-tabs-view name="console" icon="dns" label="サーバー本体" />
    <icon-tabs-view name="property" icon="list_alt" label="プロパティ" />
    <icon-tabs-view name="player" icon="group" label="プレイヤー管理" />
    <icon-tabs-view name="contents" disable-router class="q-pa-none">
      <!-- ボタンの描画がずれないようにStyleを細かく定義 -->
      <!-- TODO: ラベル名が表示されないバグの修正 -->
      <q-btn-dropdown
        auto-close
        stretch
        flat
        icon="library_add"
        :label="$q.screen.gt.md || $route.path in ['/datapack', '/plugin', '/mod'] ? '追加コンテンツ' : undefined"
        style="
          background: #3B3B3B;
          padding-top: 8px;
          padding-bottom: 8px;
          margin-top: -4px;
          margin-bottom: -4px;"
      >
        <q-list>
          <drop-btn-view name="datapack" label="データパック" />
          <drop-btn-view name="plugin" label="プラグイン" />
          <drop-btn-view name="mod" label="MOD" />
        </q-list>
      </q-btn-dropdown>
    </icon-tabs-view>
    <icon-tabs-view name="share-world" icon="share" label="ワールド共有" />
  </q-tabs>

  <q-separator />
</template>