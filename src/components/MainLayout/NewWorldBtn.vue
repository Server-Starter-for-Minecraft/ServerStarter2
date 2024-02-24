<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { tError } from 'src/i18n/utils/tFunc';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { checkError } from '../Error/Error';
import { moveScrollTop_Home } from '../World/HOME/scroll';
import { CustomMapImporterProp } from './CustomMapImporter/iCustomMapImporter';
import { RecoverDialogProp } from './RecoverDialog/iRecoverDialog';
import CustomMapImporterView from './CustomMapImporter/CustomMapImporterView.vue';
import CheckDialog from './CustomMapImporter/checkDialog.vue';
import RecoverDialog from './RecoverDialog/RecoverDialog.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

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

type ContentData = {
  icon: string;
  i18nKey: string;
  disable?: () => boolean;
  action: () => void | Promise<void>;
};
const contents: ContentData[] = [
  {
    icon: 'add_box',
    i18nKey: 'newWorld',
    action: createNewWorld,
  },
  {
    icon: 'public',
    i18nKey: 'customMap',
    action: openCustomMapImporter,
  },
  {
    icon: 'content_paste',
    i18nKey: 'duplicate',
    disable: () => router.currentRoute.value.path.slice(0, 7) === '/system',
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
async function createNewWorld() {
  // 新規ワールドの生成
  await mainStore.createNewWorld();
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
async function duplicateWorld() {
  $q.dialog({
    component: CheckDialog,
    componentProps: {
      icon: mainStore.world.avater_path,
      worldName: mainStore.world.name,
      versionName: mainStore.world.version.id,
      importFunc: async () =>
        await mainStore.createNewWorld(mainStore.world.id),
    } as CustomMapImporterProp,
  }).onOk(() => {
    move2HomeTop();
  });
}

/**
 * バックアップデータの導入を行う
 */
async function introduceBackup() {
  const res = await window.API.invokePickDialog({
    type: 'backup',
    container: mainStore.world.container,
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
          :disable="content.disable ? content.disable() : false"
          clickable
          v-close-popup
          @click="content.action"
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
