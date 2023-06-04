<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()
const tab = ref('home')

async function to(url: string) {
  await router.push(`/${url}`)
}
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
    <q-tab name="home" label="ホーム" @click="to('')" />
    <q-tab name="console" label="サーバー本体" @click="to('console')" />
    <q-tab name="property" label="プロパティ" @click="to('property')" />
    <q-tab name="player" label="プレイヤー管理" @click="to('player')" />
    <q-tab name="contents" class="q-pa-none">
      <!-- ボタンの描画がずれないようにStyleを細かく定義 -->
      <q-btn-dropdown
        auto-close
        stretch
        flat
        label="追加コンテンツ"
        style="
          background: #3B3B3B;
          padding-top: 8px;
          padding-bottom: 8px;
          margin-top: -4px;
          margin-bottom: -4px;"
      >
        <q-list>
          <q-item :active="$route.path==='/datapack'" clickable @click="to('datapack')">
            <q-item-section>データパック</q-item-section>
          </q-item>
          <q-item :active="$route.path==='/plugin'" clickable @click="to('plugin')">
            <q-item-section>プラグイン</q-item-section>
          </q-item>
          <q-item :active="$route.path==='/mod'" clickable @click="to('mod')">
            <q-item-section>MOD</q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>
    </q-tab>
    <q-tab name="share-world" label="ワールド共有" @click="to('share-world')" />
  </q-tabs>

  <q-separator />
</template>