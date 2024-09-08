<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { DetailsEditorProp, DetailsEditorReturns } from './iDetailsEditor';
import MemoFieldView from './MemoField/MemoFieldView.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<DetailsEditorProp>();

const contentTitle = ref(prop.title);
const contentShareable = ref(prop.shareable);
const contentDesc = ref(prop.description);

function onOkClicked() {
  onDialogOK({
    title: contentTitle.value,
    shareable: contentShareable.value,
    description: contentDesc.value,
  } as DetailsEditorReturns);
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <BaseDialogCard
      :title="$t('additionalContents.contentDetails')"
      :ok-btn-txt="$t('additionalContents.detailsEditor.okBtn')"
      @ok-click="onOkClicked"
      @close="onDialogCancel"
    >
      <template #default>
        <div class="column q-gutter-y-lg">
          <div class="text-caption" style="opacity: 0.6">
            <span v-if="isShareWorld">
              {{ $t('additionalContents.detailsEditor.descSW') }}
            </span>
            <span v-else>
              {{ $t('additionalContents.detailsEditor.desc') }}
            </span>
          </div>

          <div>
            <p class="q-my-sm">
              {{ $t('additionalContents.detailsEditor.contentsName') }}
            </p>
            <SsInput v-model="contentTitle" dense />
          </div>

          <div v-if="isShareWorld">
            <p class="q-my-sm">
              {{ $t('additionalContents.detailsEditor.share.title') }}
            </p>
            <p class="text-caption" style="opacity: 0.6; white-space: pre-line">
              {{ $t('additionalContents.detailsEditor.share.desc') }}
            </p>
            <q-toggle
              v-model="contentShareable"
              dense
              :label="
                contentShareable
                  ? $t('additionalContents.detailsEditor.share.toggleON')
                  : $t('additionalContents.detailsEditor.share.toggleOFF')
              "
            />
          </div>

          <div>
            <p class="q-my-sm col">
              {{ $t('additionalContents.detailsEditor.memoField.title') }}
            </p>
            <MemoFieldView v-model="contentDesc" />
          </div>
        </div>
      </template>

      <template #additionalBtns>
        <SsBtn :label="$t('general.cancel')" @click="onDialogCancel" />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>
