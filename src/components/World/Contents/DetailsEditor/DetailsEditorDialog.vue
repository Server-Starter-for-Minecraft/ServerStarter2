<script setup lang="ts">
import { ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { urlAnalyzer } from 'src/scripts/urlAnalyzer';
import SsA from 'src/components/util/base/ssA.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsTextarea from 'src/components/util/base/ssTextarea.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { DetailsEditorProp, DetailsEditorReturns } from './iDetailsEditor';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<DetailsEditorProp>();

const contentTitle = ref(prop.title);
const contentShareable = ref(prop.shareable);
const contentDesc = ref(prop.description);

const descEditMode = ref(false);

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
        <div class="column q-gutter-y-lg" @click="() => (descEditMode = false)">
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
            <q-scroll-area
              v-if="!descEditMode"
              @click.stop="() => (descEditMode = true)"
              style="border: 1px solid; border-radius: 5px; height: 10rem"
            >
              <div
                class="q-pa-md"
                :class="contentDesc === '' ? 'placeholder' : ''"
                style="word-break: break-all"
              >
                <span v-if="contentDesc === ''">クリックしてメモを編集</span>
                <!-- 生成した行を連ねる -->
                <template
                  v-else
                  v-for="(urlTxts, idx) in urlAnalyzer(contentDesc)"
                  :key="idx"
                >
                  <!-- 一行を生成 -->
                  <div class="full-width row">
                    <template v-for="(urlTxt, _idx) in urlTxts" :key="_idx">
                      <div
                        v-if="urlTxt.type === 'txt' && urlTxt.value !== ''"
                        style="white-space: pre-wrap"
                      >
                        {{ urlTxt.value }}
                      </div>
                      <!-- 改行だけの行が描画されるように半角スペースを入れて描画 -->
                      <div v-if="urlTxt.type === 'txt' && urlTxt.value === ''">
                        &nbsp;
                      </div>
                      <SsA
                        v-else-if="urlTxt.type === 'url'"
                        :url="urlTxt.value"
                        @click.stop="() => {}"
                      >
                        {{ urlTxt.value }}
                      </SsA>
                    </template>
                  </div>
                </template>
              </div>
            </q-scroll-area>
            <SsTextarea v-else v-model="contentDesc" autofocus height="10rem" />
          </div>
        </div>
      </template>

      <template #additionalBtns>
        <SsBtn :label="$t('general.cancel')" @click="onDialogCancel" />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>

<style scoped lang="scss">
.placeholder {
  opacity: 0.6;
}
</style>
