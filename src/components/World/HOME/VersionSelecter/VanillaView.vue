<script setup lang="ts">
import { ref } from 'vue';
import { VanillaVersion } from 'app/src-electron/schema/version';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import SsSelect from 'src/components/util/base/ssSelect.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()

const isRelease = ref(false)
const vanillas = sysStore.serverVersions.get('vanilla') as VanillaVersion[] | undefined
</script>

<template>
  <div class="row justify-between q-gutter-md">
    <SsSelect
      v-model="mainStore.world.version"
      :options="vanillas?.filter(ver => !isRelease || ver['release'])"
      :label="$t('home.version.versionType')"
      option-label="id"
      :disable="vanillas === void 0"
      class="col"
      style="min-width: 8rem;"
    />
    <div class="column items-end">
      <span>{{ $t('home.version.displayVersion') }}</span>
      <q-toggle
        v-model="isRelease"
        :label="isRelease ? $t('home.version.onlyReleased') : $t('home.version.allVersions')"
        left-label
        style="width: fit-content;"
      />
    </div>
  </div>
</template>