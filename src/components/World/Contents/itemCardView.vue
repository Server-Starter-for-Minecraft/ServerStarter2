<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import { $T } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { useContentsStore } from 'src/stores/WorldTabs/ContentsStore';
import { dangerDialogProp } from 'src/components/util/danger/iDangerDialog';
import BaseActionsCard from '../utils/BaseActionsCard.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import DangerDialog from 'src/components/util/danger/DangerDialog.vue';

type T = DatapackData | ModData | PluginData;

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod';
  content: AllFileData<T>;
  isDelete?: boolean;
  color?: string;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const contentsStore = useContentsStore();

async function addContent() {
  await contentsStore.setNewContents(mainStore.world.id, prop.content);
  (mainStore.world.additional[`${prop.contentType}s`] as AllFileData<T>[]).push(
    prop.content
  );
}

async function deleteContent() {
  function __delete() {
    mainStore.world.additional[`${prop.contentType}s`].splice(
      mainStore.world.additional[`${prop.contentType}s`]
        .map((c) => c.name)
        .indexOf(prop.content.name),
      1
    );
  }

  // 起動前に登録された追加コンテンツに対して警告を出さない
  if (await contentsStore.isNewContents(mainStore.world.id, prop.content)) {
    __delete();
  } else {
    $q.dialog({
      component: DangerDialog,
      componentProps: {
        dialogTitle: `${$T(`additionalContents.${prop.contentType}`)}の削除`,
        dialogDesc: `起動履歴のあるワールドから${$T(
          `additionalContents.${prop.contentType}`
        )}を削除する操作は，ワールドデータが破損する恐れがあります．<br>危険性を理解した上で削除しますか？`,
        okBtnTxt: '危険性を理解して削除する',
      } as dangerDialogProp,
    }).onOk(() => {
      __delete();
    });
  }
}

const transformedName = computed(() =>
  prop.content.name.replace(/§./g, '').trim()
);
const transformedDescription = computed(() =>
  'description' in prop.content
    ? prop.content.description.replace(/§./g, '').trim()
    : ''
);
</script>

<template>
  <BaseActionsCard
    :style="{
      'border-radius': '6px',
      'background-color': color,
    }"
  >
    <template #default>
      <q-item class="q-pr-sm">
        <q-item-section>
          <q-item-label class="contentsName text-omit">
            {{ transformedName }}
            <SsTooltip
              :name="transformedName"
              anchor="bottom start"
              self="center start"
            />
          </q-item-label>
          <q-item-label
            v-if="'description' in content"
            class="text-omit"
            style="opacity: 0.7"
          >
            {{ transformedDescription }}
            <SsTooltip
              :name="transformedDescription"
              anchor="bottom start"
              self="center start"
            />
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="isDelete" side>
          <q-btn
            dense
            flat
            stack
            color="negative"
            icon="close"
            size="1rem"
            @click="deleteContent"
          >
            <div
              class="text-negative text-center full-width"
              style="font-size: 0.8rem"
            >
              {{ $t('general.delete') }}
            </div>
          </q-btn>
        </q-item-section>
        <q-item-section v-else side>
          <q-btn
            dense
            flat
            stack
            color="primary"
            icon="add"
            size="1rem"
            @click="addContent"
          >
            <div
              class="text-primary text-center full-width"
              style="font-size: 0.8rem"
            >
              {{ $t('additionalContents.install') }}
            </div>
          </q-btn>
        </q-item-section>
      </q-item>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.contentsName {
  font-size: 1.5rem;
}
</style>
