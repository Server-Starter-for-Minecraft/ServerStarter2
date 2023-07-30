<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
</script>

<template>
  <SsSelect
    v-model="mainStore.world.version"
    :options="sysStore.serverVersions.get('spigot')"
    :label="$t('home.version.versionType')"
    option-label="id"
    :disable="sysStore.serverVersions.get('spigot') === void 0"
    class="col"
  />
</template>