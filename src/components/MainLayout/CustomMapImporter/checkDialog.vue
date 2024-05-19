<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import LoadingLogo from 'src/assets/animation/LoadingLogo.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';
import { CustomMapImporterProp } from './iCustomMapImporter';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<CustomMapImporterProp>();

// Dialogの表示と同時に導入を始める
importProcess();

async function importProcess() {
  await prop.importFunc();
  onDialogOK();
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <BaseDialogCard
      :title="$t('mainLayout.customMapImporter.checkDialog.title')"
      style="max-width: 100%"
    >
      <q-item dense class="q-pl-none">
        <q-item-section>
          <p style="white-space: pre-line">
            {{ $t('mainLayout.customMapImporter.checkDialog.desc') }}
          </p>
          <WorldItem
            :icon="icon"
            :world-name="worldName"
            :version-name="versionName"
          />
        </q-item-section>
        <q-item-section avatar>
          <LoadingLogo style="width: 4rem" />
        </q-item-section>
      </q-item>
    </BaseDialogCard>
  </q-dialog>
</template>
