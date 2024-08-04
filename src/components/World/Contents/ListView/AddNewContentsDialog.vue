<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import DragDropFile from 'src/components/util/DragDropFile.vue';
import {
  importMultipleContents,
  importNewContentFromPath,
} from '../contentsPage';
import { AddContentDialogProp } from './iAddNewContentsDialog';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<AddContentDialogProp>();

function importNewContent(paths: string[]) {
  paths.forEach((p) => {
    importNewContentFromPath(prop.contentType, p);
  });

  onDialogOK();
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('additionalContents.newContentDialog.title')"
      @close="onDialogCancel"
    >
      <div class="q-pl-md" style="opacity: 0.6">
        {{ $t('additionalContents.newContentDialog.desc') }}
      </div>

      <q-card-section>
        <h1 class="q-pt-none">
          {{ $t('additionalContents.newContentDialog.file_title') }}
        </h1>
        <DragDropFile
          :draged="importNewContent"
          :accept-ext="contentType === 'datapack' ? '.zip' : '.zip,.jar'"
        />
      </q-card-section>
      <q-card-section>
        <h1 class="q-pt-none">
          {{ $t('additionalContents.newContentDialog.world_title') }}
        </h1>
        <div style="opacity: 0.6; white-space: pre-line">
          {{ $t('additionalContents.newContentDialog.world_desc') }}
        </div>
        <SsBtn
          free-width
          color="primary"
          :label="$t('additionalContents.newContentDialog.world_btn')"
          class="full-width q-my-md"
          @click="() => importMultipleContents($q, contentType)"
          v-close-popup
        />
      </q-card-section>
    </BaseDialogCard>
  </q-dialog>
</template>

<style scoped lang="scss">
.drop-box {
  border: 1px dashed;
  border-radius: 5px;
}
</style>
