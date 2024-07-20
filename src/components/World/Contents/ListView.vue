<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useQuasar } from 'quasar';
import { keys } from 'app/src-public/scripts/obj/obj';
import { strSort } from 'app/src-public/scripts/obj/objSort';
import { AllFileData } from 'app/src-electron/schema/filedata';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SsIconBtn from 'src/components/util/base/ssIconBtn.vue';
import {
  addContent,
  ContentsData,
  ContentsType,
  getAllContents,
  importMultipleContents,
  importNewContent,
  isSameContent,
  openSavedFolder,
  OptContents,
} from './contentsPage';
import AddNewContentsDialog from './ListView/AddNewContentsDialog.vue';
import { AddContentDialogProp } from './ListView/iAddNewContentsDialog';
import ListItem from './ListView/ListItem.vue';
import SearchResultItem from './ListView/SearchResultItem.vue';

interface Prop {
  contentType: ContentsType;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const mainStore = useMainStore();
const consoleStore = useConsoleStore();

const selectedContent: Ref<OptContents | undefined> = ref();
const initNewContents = () =>
  getAllContents(prop.contentType).filter(
    (c) =>
      !mainStore.world?.additional[`${prop.contentType}s`].some((_c) =>
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

function openAddContentDialog() {
  $q.dialog({
    component: AddNewContentsDialog,
    componentProps: {
      contentType: prop.contentType,
    } as AddContentDialogProp,
  });
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
      <SsBtn
        free-width
        icon="library_add"
        label="コンテンツを新規追加"
        @click="() => openAddContentDialog()"
      />
      <!-- <SsBtn
        free-width
        icon="library_add"
        label="まとめて追加"
        :disable="keys(mainStore.allWorlds.filteredWorlds()).length < 2"
        @click="() => importMultipleContents($q, contentType)"
      /> -->
      <!-- <SsIconBtn
        flat
        size=".8rem"
        icon="add_box"
        tooltip="追加コンテンツを新規追加"
        @click="() => importNewContent(contentType, true)"
      /> -->
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
        consoleStore.status(mainStore.selectedWorldID) !== 'Stop' &&
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
      <div
        v-if="mainStore.world?.additional[`${contentType}s`].length ?? 0 > 0"
      >
        <q-list separator>
          <ListItem
            v-for="c in mainStore.world?.additional[`${contentType}s`].sort(
              (c1, c2) => strSort(c1.name, c2.name)
            )"
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
