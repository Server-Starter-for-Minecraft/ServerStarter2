<script setup lang="ts">
import { tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from 'src/components/Error/Error';
import SsBtn from 'src/components/util/base/ssBtn.vue';

const mainStore = useMainStore();

async function openFolder() {
  const path = await window.API.invokeGetWorldPaths(
    mainStore.selectedWorldID,
    'server'
  );

  checkError(
    path,
    async (p) => {
      const res = await window.API.sendOpenFolder(p, true);
      checkError(res, undefined, (e) => tError(e));
    },
    (e) => tError(e)
  );
}
</script>

<template>
  <div class="column q-gutter-y-md q-pa-sm">
    <div class="row items-center q-gutter-md">
      <q-icon size="4rem" name="warning" color="negative" />
      <span class="col">
        {{
          $t('mainLayout.failedLoading', {
            name: mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID]
              .world.name,
          })
        }}
      </span>
    </div>
    <q-separator />
    <div class="q-pa-md">
      <p class="q-my-none">
        {{
          mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID].error
            ?.title
        }}
      </p>
      <span class="text-caption">
        {{
          mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID].error
            ?.desc
        }}
      </span>
    </div>
    <div class="flex justify-end">
      <SsBtn :label="$t('others.openFolder.btnText')" @click="openFolder" />
    </div>
  </div>
</template>
