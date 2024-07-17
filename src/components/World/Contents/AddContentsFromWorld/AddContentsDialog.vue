<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { deepcopy } from 'app/src-public/scripts/deepcopy';
import { WorldEdited, WorldID } from 'app/src-electron/schema/world';
import { useMainStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { isSameContent } from '../contentsPage';
import { AddContentProp, AddContentsReturns } from './iAddContents';
import ContentItemView from './itemViews/ContentItemView.vue';
import WorldItemView from './itemViews/WorldItemView.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<AddContentProp>();

const mainStore = useMainStore();
// TODO: Idsは意味不明なIDではなくcontentIdを持つ仕様に変更
const selectedContentsIds: Ref<string[]> = ref([]);
const selectedWorld: Ref<WorldEdited | undefined> = ref();

const showingContents = () => {
  if (!mainStore.world) {
    return [];
  }

  const worldContents = mainStore.world.additional[`${prop.contentType}s`];
  return selectedWorld.value?.additional[`${prop.contentType}s`].filter((c) =>
    worldContents.every((wContent) => !isSameContent(wContent, c))
  );
};

// TODO: 以下，一致判定を名前ではなくContentIDに置換

function onOkClicked() {
  const importContents = selectedContentsIds.value.map((ids) => {
    const worldID = (ids.split('#')[0] as WorldID) ?? '';
    const contentName = ids.split('#')[1] ?? '';

    const targetWorld = mainStore.allWorlds.readonlyWorlds[worldID];
    if (targetWorld.type === 'abbr') {
      return undefined;
    }

    return targetWorld.world.additional[`${prop.contentType}s`].find(
      (content) => content.name === contentName
    );
  });

  onDialogOK({
    importContents: importContents.filter(Boolean),
  } as AddContentsReturns);
}

function onWorldClicked(world: WorldEdited) {
  selectedWorld.value = deepcopy(world);
}

function registContent(contentName: string) {
  selectedContentsIds.value.push(`${selectedWorld.value?.id}#${contentName}`);
}
function removeContent(contentName: string) {
  const removeIdx = selectedContentsIds.value.indexOf(
    `${selectedWorld.value?.id}#${contentName}`
  );
  if (removeIdx > -1) {
    selectedContentsIds.value.splice(removeIdx, 1);
  }
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      title="まとめてコンテンツを追加"
      ok-btn-txt="選択したコンテンツを追加"
      :disable="selectedContentsIds.length === 0"
      @ok-click="onOkClicked"
      @close="onDialogCancel"
      style="max-width: 100%"
    >
      <q-card-section horizontal>
        <div>
          <q-list>
            <template
              v-for="worldItem in mainStore.allWorlds.filteredWorlds()"
              :key="worldItem.world.id"
            >
              <WorldItemView
                v-if="
                  worldItem.type === 'edited' &&
                  worldItem.world.id !== mainStore.selectedWorldID
                "
                :active="worldItem.world.id === selectedWorld?.id"
                :is-selected="
                  worldItem.world.additional[`${contentType}s`].some((c) =>
                    selectedContentsIds.some(
                      (cId) => cId === `${worldItem.world.id}#${c.name}`
                    )
                  )
                "
                :world="worldItem.world"
                @clicked="onWorldClicked"
              />
            </template>
          </q-list>
        </div>

        <q-separator vertical class="q-mx-md" />

        <div style="min-height: 40vh; max-height: 80vh">
          <div v-if="!selectedWorld" style="opacity: 0.6; width: 15rem">
            左側から追加したいコンテンツを含むワールドを選択してください
          </div>
          <div
            v-else-if="showingContents()?.length ?? 0 > 0"
            class="fit column q-gutter-y-md"
          >
            <q-scroll-area class="col" style="width: 15rem">
              <q-list>
                <template
                  v-for="content in showingContents()"
                  :key="content.name"
                >
                  <ContentItemView
                    v-model="selectedContentsIds"
                    :content="content"
                    :content-id="`${selectedWorld?.id}#${content.name}`"
                  />
                </template>
              </q-list>
            </q-scroll-area>
            <div class="row q-gutter-x-sm">
              <SsBtn
                free-width
                label="全て追加する"
                class="col"
                @click="
                  () => showingContents()?.forEach((c) => registContent(c.name))
                "
              />
              <SsBtn
                free-width
                label="全て解除する"
                class="col"
                @click="
                  () => showingContents()?.forEach((c) => removeContent(c.name))
                "
              />
            </div>
          </div>
          <div
            v-else
            class="text-center"
            style="opacity: 0.6; min-width: 15rem"
          >
            追加可能なコンテンツがありません
          </div>
        </div>
      </q-card-section>
    </BaseDialogCard>
  </q-dialog>
</template>
