<script setup lang="ts">
import SsBtn from 'src/components/util/base/ssBtn.vue';
import { useMainStore } from 'src/stores/MainStore';

const mainStore = useMainStore();

function openFolder() {}
</script>

<template>
  <div class="q-pl-md">
    <div class="text-caption" style="opacity: 0.6">
      ワールドデータの保存場所となっているフォルダを開く
    </div>
    <SsBtn label="フォルダを開く" @click="openFolder" class="q-mt-md" />
  </div>
</template>
