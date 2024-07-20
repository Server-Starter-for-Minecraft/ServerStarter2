<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import DragDropFile from 'src/components/util/DragDropFile.vue';
import { importMultipleContents, importNewContent } from '../contentsPage';
import { AddContentDialogProp } from './iAddNewContentsDialog';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
defineProps<AddContentDialogProp>();
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      title="追加コンテンツを新規追加"
      @ok-click="onDialogOK"
      @close="onDialogCancel"
    >
      <div class="q-pl-md" style="opacity: 0.6">
        このワールドに導入する追加コンテンツを下記いずれかより設定できます
      </div>

      <q-card-section>
        <h1 class="q-pt-none">ファイルから追加</h1>

        <DragDropFile />

        <!-- <div
          class="full-width drop-box column items-center justify-center"
          style="height: 10rem"
        >
          <input
            ref="dropFileBox"
            type="file"
            name="file"
            multiple
            id="fileInput"
            class="hidden-input"
            @change="onChange"
            accept=".pdf,.jpg,.jpeg,.png"
          />

          <span>追加したいコンテンツをドラッグ＆ドロップ</span>
          <div class="q-py-md" style="opacity: 0.6">または</div>
          <SsBtn
            label="ファイルを選択"
            @click="() => importNewContent(contentType, true)"
          />
        </div> -->
      </q-card-section>
      <q-card-section>
        <h1 class="q-pt-none">まとめて追加</h1>
        <div style="opacity: 0.6">
          各ワールドに導入済みの追加コンテンツをまとめて追加できます．<br />
          追加用のダイアログを開いて各ワールドのコンテンツを確認しましょう．
        </div>
        <SsBtn
          free-width
          label="各ワールドからコンテンツを追加する"
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
