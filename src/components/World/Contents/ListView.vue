<script setup lang="ts">
import { Ref, ref } from 'vue';
import { AllFileData } from 'app/src-electron/schema/filedata';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsIconBtn from 'src/components/util/base/ssIconBtn.vue';
import {
  addContent,
  ContentsData,
  ContentsType,
  getAllContents,
  importNewContent,
  isSameContent,
  openSavedFolder,
  OptContents,
} from './contentsPage';
import ListItem from './ListView/ListItem.vue';
import SearchResultItem from './ListView/SearchResultItem.vue';

interface Prop {
  contentType: ContentsType;
}
const prop = defineProps<Prop>();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const selectedContent: Ref<OptContents | undefined> = ref();
const initNewContents = () =>
  getAllContents(prop.contentType).filter(
    (c) =>
      !mainStore.world.additional[`${prop.contentType}s`].some((_c) =>
        isSameContent(_c, c.file)
      )
  );
const newContents = ref(initNewContents());

function newContentsFilter(
  val: string,
  update: (callbackFn: () => void) => void,
  abort: () => void
) {
  // 検索を始める文字数
  const startSearchLetter = 1;

  if (val.length < startSearchLetter) {
    abort();
    return;
  }

  update(() => {
    const needle = val.toLowerCase();
    newContents.value = initNewContents().filter(
      (v) =>
        v.file.name.toLowerCase().indexOf(needle) > -1 ||
        v.wNames.some((name) => name.toLowerCase().indexOf(needle) > -1)
    );
  });
}

function addContentClicked(content: AllFileData<ContentsData>) {
  addContent(prop.contentType, content);
  selectedContent.value = undefined;
}

function importMultipleContents() {
  // TODO: ワールド一覧 -> 導入コンテンツの選択 -> 導入 のダイアログを作成
  throw 'This is not implimented';
}
</script>

<template>
  <div class="q-px-md">
    <h1 class="q-py-xs">
      {{
        $t('additionalContents.management', {
          type: $t(`additionalContents.${contentType}`),
        })
      }}
    </h1>

    <div class="row items-center q-gutter-md">
      <q-select
        dense
        filled
        placeholder="追加したいコンテンツ名を入力"
        v-model="selectedContent"
        @update:model-value="(newVal: OptContents) => addContentClicked(newVal.file)"
        use-input
        hide-dropdown-icon
        :options="newContents"
        option-label="name"
        @filter="newContentsFilter"
        class="col"
      >
        <template v-slot:no-option>
          <q-item>
            <q-item-section class="text-grey"> No results </q-item-section>
          </q-item>
        </template>

        <template v-slot:option="scope">
          <SearchResultItem :item-props="scope.itemProps" :opt="scope.opt" />
        </template>
      </q-select>
      <SsIconBtn
        flat
        size=".8rem"
        icon="library_add"
        tooltip="既存ワールドから一括で追加"
        @click="() => importMultipleContents()"
      />
      <SsIconBtn
        flat
        size=".8rem"
        icon="add_box"
        tooltip="追加コンテンツを新規追加"
        @click="() => importNewContent(contentType, true)"
      />
      <SsIconBtn
        v-if="contentType !== 'datapack'"
        flat
        size=".8rem"
        icon="folder_open"
        tooltip="保存先フォルダを開く"
        @click="() => openSavedFolder(contentType)"
      />
    </div>
    <p
      v-if="
        consoleStore.status(mainStore.world.id) !== 'Stop' &&
        contentType !== 'datapack'
      "
      class="text-caption text-negative q-ma-none"
    >
      {{ $t('additionalContents.needReboot') }}
    </p>

    <div class="q-my-sm">
      <span class="text-caption">
        {{
          $t('additionalContents.installed', {
            type: $t(`additionalContents.${contentType}`),
          })
        }}
      </span>
      <div v-if="mainStore.world.additional[`${contentType}s`].length > 0">
        <q-list separator>
          <ListItem
            v-for="c in mainStore.world.additional[`${contentType}s`]"
            :key="c.name"
            :content-type="contentType"
            :content="c"
          />
        </q-list>
        <q-separator />
      </div>
      <p v-else class="q-my-xl text-center text-h5" style="opacity: 0.6">
        {{
          $t('additionalContents.notInstalled', {
            type: $t(`additionalContents.${contentType}`),
          })
        }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
