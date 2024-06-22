<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { AllFileData } from 'app/src-electron/schema/filedata';
import SsIconBtn from 'src/components/util/base/ssIconBtn.vue';
import {
  ContentsData,
  ContentsType,
  deleteContent,
  showingContentDescription,
  showingContentName,
} from '../contentsPage';
import DetailsEditorDialog from '../DetailsEditor/DetailsEditorDialog.vue';
import {
  DetailsEditorProp,
  DetailsEditorReturns,
} from '../DetailsEditor/iDetailsEditor';

interface Prop {
  contentType: ContentsType;
  content: AllFileData<ContentsData>;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const hover = ref(false);
const innerContent = ref(prop.content);

function onDetailBtnClicked() {
  $q.dialog({
    component: DetailsEditorDialog,
    componentProps: {
      // TODO: 渡す情報を最終版に更新する
      isShareWorld: true,
      title: innerContent.value.name,
      shareable: true,
      description: '',
    } as DetailsEditorProp,
  }).onOk((p: DetailsEditorReturns) => {
    innerContent.value.name = p.title;
    // TODO: このほかの値も更新する
    // 更新した`innerContent`を一覧で持つデータにも更新する
  });
}
</script>

<template>
  <q-item
    @mouseenter="hover = true"
    @mouseleave="hover = false"
    :class="hover ? 'hoveredItem' : ''"
  >
    <q-item-section>
      <q-item-label style="font-size: 1rem">
        {{ showingContentName(innerContent) }}
      </q-item-label>
      <q-item-label v-if="'description' in innerContent" style="opacity: 0.7">
        {{ showingContentDescription(innerContent) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side v-show="hover">
      <div class="row q-gutter-x-sm">
        <SsIconBtn
          flat
          icon="info"
          tooltip="詳細情報"
          @click="onDetailBtnClicked"
        />
        <q-separator vertical />
        <SsIconBtn
          flat
          icon="close"
          tooltip="削除"
          color="negative"
          @click="() => deleteContent($q, contentType, innerContent)"
        />
      </div>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
.hoveredItem {
  background-color: rgba($primary, 0.2);
}
</style>
