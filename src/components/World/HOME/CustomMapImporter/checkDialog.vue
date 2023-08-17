<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { assets } from 'src/assets/assets';
import { CustomMapImporterProp, importCustomMap } from './iCustomMapImporter';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
const prop = defineProps<CustomMapImporterProp>()

const loading = ref(false)

async function updateWorld() {
  loading.value = true
  await importCustomMap(prop.customMap)
  onDialogOK()
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="loading">
    <BaseDialogCard
      :title="$t('home.useWorld.checkWorldInstall')"
      :ok-btn-txt="$t('home.useWorld.installBtn')"
      :loading="loading"
      @ok-click="updateWorld"
      @close="onDialogCancel"
      style="max-width: 100%;"
    >
      <p v-html="$t('home.useWorld.checkDialog')" />
      <WorldItem
        :icon="customMap.icon ?? assets.png.unset"
        :world-name="customMap.levelName"
        :version-name="customMap.versionName"
      />
    </BaseDialogCard>
  </q-dialog>
</template>