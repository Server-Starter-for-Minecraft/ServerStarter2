<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { moveScrollTop_Home } from '../World/HOME/scroll';
import CustomMapImporterView from './CustomMapImporter/CustomMapImporterView.vue';

interface Prop {
  miniChangeWidth: number
}
const prop = defineProps<Prop>()

const $q = useQuasar()
const router = useRouter()
const sysStore = useSystemStore()
const mainStore = useMainStore()

const isMini = () => sysStore.systemSettings.user.drawerWidth < prop.miniChangeWidth

type ContentData = {
  icon: string
  name: string
  caption: string
  action: () => void
}
const contents: ContentData[] = [
  {
    icon: 'add_box',
    name: '新規ワールドを追加',
    caption: '完全に新しいワールドを新規作成する',
    action: createNewWorld
  },
  {
    icon: 'public',
    name: '既存のワールドを導入',
    caption: 'zip形式の配布ワールドやシングルプレイのワールドを導入する',
    action: openCustomMapImporter
  },
  {
    icon: 'content_paste',
    name: '表示中のワールドを複製',
    caption: 'バージョンやプロパティなどの各種設定を引き継いで複製する',
    action: openCustomMapImporter
  },
  {
    icon: 'history',
    name: 'バックアップワールドを導入',
    caption: 'バックアップ済みのワールドを追加する',
    action: openCustomMapImporter
  },
]


/**
 * 新規ワールドを生成
 */
async function createNewWorld() {
  // 新規ワールドの生成
  await mainStore.createNewWorld()

  // 画面遷移
  if (router.currentRoute.value.path === '/') {
    moveScrollTop_Home()
  }
  else {
    router.push('/')
  }
}

/**
 * 配布ワールドとローカルワールドの導入画面を表示する
 */
function openCustomMapImporter() {
  $q.dialog({
    component: CustomMapImporterView,
  })
}

</script>

<template>
  <q-btn-dropdown
    square
    fab-mini
    menu-anchor="bottom right"
    menu-self="bottom left"
    dropdown-icon="keyboard_arrow_right"
  >
    <template v-slot:label>
      <q-item dense style="margin-left: -8px;">
        <q-item-section avatar>
          <q-icon name="add" size="2rem" class="q-py-sm"/>
        </q-item-section>
        <q-item-section>
          <span style="font-size: 1rem;">{{ $t('worldList.addWorld') }}</span>
        </q-item-section>
      </q-item>
      <q-space v-if="!isMini()" />
      <q-tooltip anchor="center middle" self="top middle" :delay="500">
        {{ $t('worldList.addWorld') }}
      </q-tooltip>
    </template>

    <q-list>
      <template v-for="content in contents" :key="content.name">
        <q-item clickable v-close-popup @click="content.action" style="height: 3.5rem;">
          <q-item-section avatar>
            <q-icon :name="content.icon" text-color="white" size="1.5rem" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="content-title">{{ content.name }}</q-item-label>
            <q-item-label class="content-caption">{{ content.caption }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-btn-dropdown>
</template>

<style scoped lang="scss">
.content-title {
  font-size: .9rem;
  padding-bottom: 2px;
}

.content-caption {
  font-size: .6rem;
  opacity: .6;
}
</style>