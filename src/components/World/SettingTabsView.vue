<script setup lang="ts">
</script>

<template>
  <q-tabs
    align="left"
    dense
    :breakpoint="0"
    indicator-color="primary"
    class="fit q-px-sm"
    style="flex: 1 1 0;"
  >
    <q-route-tab to="/" label="ホーム" />
    <q-route-tab to="/console" label="サーバー本体" />
    <q-route-tab to="/property" label="プロパティ" />
    <q-route-tab to="/player" label="プレイヤー管理" />
    <q-route-tab to="/contents" label="追加コンテンツ" />
    <q-route-tab to="/share-world" label="ワールド共有" />
  </q-tabs>

  <q-separator />
</template>