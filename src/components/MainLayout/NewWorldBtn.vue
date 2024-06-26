<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { WorldEdited } from 'app/src-electron/schema/world';
import { tError } from 'src/i18n/utils/tFunc';
import { useMainStore } from 'src/stores/MainStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { createNewWorld, updateBackWorld } from 'src/stores/WorldStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { checkError } from '../Error/Error';
import { moveScrollTop_Home } from '../World/HOME/scroll';
import CheckDialog from './CustomMapImporter/checkDialog.vue';
import CustomMapImporterView from './CustomMapImporter/CustomMapImporterView.vue';
import { CustomMapImporterProp } from './CustomMapImporter/iCustomMapImporter';
import { RecoverDialogProp } from './RecoverDialog/iRecoverDialog';
import RecoverDialog from './RecoverDialog/RecoverDialog.vue';

interface Prop {
  miniChangeWidth: number;
}
const prop = defineProps<Prop>();

const $q = useQuasar();
const router = useRouter();
const sysStore = useSystemStore();
const mainStore = useMainStore();

const isMini = () =>
  sysStore.systemSettings.user.drawerWidth < prop.miniChangeWidth;

const isSearching = () => (mainStore.worldSearchText ?? '') !== '';

type ContentData = {
  icon: string;
  i18nKey: string;
  disable?: (w?: WorldEdited) => boolean;
  action: (w?: WorldEdited) => void | Promise<void>;
};
const contents: ContentData[] = [
  {
    icon: 'add_box',
    i18nKey: 'newWorld',
    action: createWorld,
  },
  {
    icon: 'public',
    i18nKey: 'customMap',
    action: openCustomMapImporter,
  },
  {
    icon: 'content_paste',
    i18nKey: 'duplicate',
    disable: (w) =>
      router.currentRoute.value.path.slice(0, 7) === '/system' || w === void 0,
    action: duplicateWorld,
  },
  {
    icon: 'history',
    i18nKey: 'backup',
    action: introduceBackup,
  },
];

/**
 * ボタンクリック後に画面遷移する
 */
function move2HomeTop() {
  // 画面遷移
  if (router.currentRoute.value.path === '/') {
    moveScrollTop_Home();
  } else {
    router.push('/');
  }
}

/**
 * 新規ワールドを生成
 */
async function createWorld() {
  // 新規ワールドの生成
  await createNewWorld();
  move2HomeTop();
}

/**
 * 配布ワールドとローカルワールドの導入画面を表示する
 */
function openCustomMapImporter() {
  $q.dialog({
    component: CustomMapImporterView,
  }).onOk(() => {
    move2HomeTop();
  });
}

/**
 * 表示中のワールドを複製する
 */
async function duplicateWorld(world?: WorldEdited) {
  if (world) {
    $q.dialog({
      component: CheckDialog,
      componentProps: {
        icon: world.avater_path,
        worldName: world.name,
        versionName: world.version.id,
        importFunc: async () => {
          const newWorldID = await createNewWorld(world.id);
          // ワールドの複製は新規ワールドとみなさない
          if (newWorldID) updateBackWorld(newWorldID);
        },
      } as CustomMapImporterProp,
    }).onOk(() => {
      move2HomeTop();
    });
  }
}

/**
 * バックアップデータの導入を行う
 */
async function introduceBackup() {
  const res = await window.API.invokePickDialog({
    type: 'backup',
    container:
      mainStore.allWorlds.readonlyWorlds[mainStore.selectedWorldID].world
        .container,
  });

  checkError(
    res,
    (b) =>
      $q
        .dialog({
          component: RecoverDialog,
          componentProps: {
            backupData: b,
          } as RecoverDialogProp,
        })
        .onOk(() => {
          move2HomeTop();
        }),
    (e) => tError(e, { ignoreErrors: ['data.path.dialogCanceled'] })
  );
}
</script>

<template>
  <q-btn-dropdown
    flat
    square
    fab-mini
    :disable="isSearching()"
    menu-anchor="bottom right"
    menu-self="bottom left"
    dropdown-icon="keyboard_arrow_right"
  >
    <template v-slot:label>
      <q-item dense style="margin-left: -8px">
        <q-item-section avatar>
          <q-icon name="add" size="2rem" class="q-py-sm" />
        </q-item-section>
        <q-item-section>
          <span style="font-size: 1rem">{{
            $t('mainLayout.newWorldBtn.addWorld')
          }}</span>
        </q-item-section>
      </q-item>
      <q-space v-if="!isMini()" />
      <SsTooltip
        :name="$t('mainLayout.newWorldBtn.addWorld')"
        anchor="center middle"
        self="top middle"
      />
    </template>

    <q-list>
      <template v-for="content in contents" :key="content.name">
        <q-item
          :disable="content.disable ? content.disable(mainStore.world) : false"
          clickable
          v-close-popup
          @click="() => content.action(mainStore.world)"
          style="height: 4rem"
        >
          <q-item-section avatar>
            <q-icon :name="content.icon" text-color="white" size="1.5rem" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="content-title">{{
              $t(`mainLayout.newWorldBtn.content.${content.i18nKey}.title`)
            }}</q-item-label>
            <q-item-label class="content-caption">{{
              $t(`mainLayout.newWorldBtn.content.${content.i18nKey}.desc`)
            }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-btn-dropdown>
</template>

<style scoped lang="scss">
.content-title {
  font-size: 0.9rem;
  padding-bottom: 2px;
}

.content-caption {
  font-size: 0.6rem;
  opacity: 0.6;
}
</style>
