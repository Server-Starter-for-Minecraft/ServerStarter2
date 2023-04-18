<script setup lang="ts">
import { versionTypes } from 'app/src-electron/api/scheme.js'
import { mainStore } from 'src/stores/MainStore';
import { ref } from 'vue';

const server = ref(versionTypes[0])
const versionList = ['1.19.1', '1.19.0']
const version = ref(versionList[0])

mainStore().setHeader('新規ワールド', {})
</script>

<template>
  <div class="absolute-center">
    <div class="row">
      <q-select
        v-model="server"
        :options="versionTypes"
        label="サーバー"
        style="width: 150px;"
      />
      <q-select
        v-model="version"
        :options="versionList"
        label="バージョン"
        style="width: 150px;"
      />
    </div>
  </div>
</template>