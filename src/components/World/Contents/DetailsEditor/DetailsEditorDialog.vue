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
      title="詳細情報"
      ok-btn-txt="変更を保存"
      @ok-click="onOkClicked"
      @close="onDialogCancel"
    >
      <template #default>
        <div class="column q-gutter-y-lg">
          <div class="text-caption" style="opacity: 0.6">
            <span v-if="isShareWorld">
              コンテンツの詳細設定は、このワールドにのみ適用されます
            </span>
            <span v-else>
              コンテンツの詳細設定は、ServerStarter2に登録されてているすべてのワールド（ShareWorldを除く）に適用されます
            </span>
          </div>

          <div>
            <p class="q-my-sm">コンテンツ名</p>
            <SsInput v-model="contentTitle" dense />
          </div>

          <div v-if="isShareWorld">
            <p class="q-my-sm">コンテンツを共有するか</p>
            <p class="text-caption" style="opacity: 0.6">
              コンテンツの規約等を確認し，ShareWorldによる共有が再配布等の規定に抵触しないことを確認してご利用ください．<br />
              本機能をOFFにすると，コンテンツの詳細情報のみ共有され，コンテンツの本体データは共有されません．
            </p>
            <q-toggle
              v-model="contentShareable"
              dense
              :label="
                contentShareable
                  ? 'コンテンツをShareWorldに入れて共有する'
                  : 'コンテンツをShareWorldで共有しない'
              "
            />
          </div>

          <div>
            <p class="q-my-sm col">メモ</p>
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
