<script setup lang="ts">
import { ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { WorldContainer, WorldName } from 'app/src-electron/schema/brands';
import { deepcopy } from "app/src-electron/util/deepcopy";
import { assets } from 'src/assets/assets';
import { checkError } from 'src/components/Error/Error';
import { AddFolderDialogReturns } from 'src/components/SystemSettings/Folder/iAddFolder';
import { isError } from 'src/scripts/error';
import { values } from 'src/scripts/obj';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldStore } from 'src/stores/MainStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { $T } from 'src/i18n/utils/tFunc'
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ExpansionView from 'src/components/World/HOME/expansionView.vue';
import DangerView from 'src/components/util/danger/dangerView.vue';
import IconSelectView from 'src/components/World/HOME/IconSelectView.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import FolderCard from 'src/components/SystemSettings/Folder/FolderCard.vue';
import AddFolderDialog from 'src/components/SystemSettings/Folder/AddFolderDialog.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import CustomMapImporterView from 'src/components/World/HOME/CustomMapImporterView.vue';
import VersionSelecterView from 'src/components/World/HOME/VersionSelecterView.vue';
import DuplicateWorldView from 'src/components/World/HOME/DuplicateWorldView.vue';
import BackupWorldView from 'src/components/World/HOME/BackupWorldView.vue';

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const $q = useQuasar()
const { t } = useI18n()

const isWorldContainerLoading = ref(false)
const scrollAreaRef = ref()

function scrollTop() {
  scrollAreaRef.value.setScrollPosition('vertical', 0)
}

/**
 * 選択されているワールドを削除する
 */
async function removeWorld() {
  /** 描画の更新 */
  function updateView() {
    const worldStore = useWorldStore()

    // 描画上のリストから削除
    mainStore.removeWorld()

    // ワールドが消失した場合は、新規ワールドを自動生成
    if (values(worldStore.worldList).length === 0) {
      mainStore.createNewWorld()
    }

    // ワールドリストの0番目を表示
    const worlds = values(worldStore.sortedWorldList)
    mainStore.setWorld(worlds[worlds.length - 1])

    // 画面を一番上に
    scrollTop()
  }

  const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID)
  checkError(
    res.value,
    updateView,
    () => { return { title: t('home.error.failedDelete', { serverName: mainStore.world.name }) } }
  )
}

/**
 * ワールドアイコンの選択（作成）画面を表示する
 */
function openIconSelecter() {
  $q.dialog({
    component: IconSelectView,
  }).onOk(() => {
    mainStore.world.avater_path = mainStore.iconCandidate
  })
}

/**
 * 配布ワールドとローカルワールドの導入画面を表示する
 */
function openCustomMapImporter() {
  $q.dialog({
    component: CustomMapImporterView,
  })
}

/**
 * ワールド名のバリデーションを行う
 */
async function validateWorldName(name: WorldName) {
  const res = await window.API.invokeValidateNewWorldName(mainStore.world.container, name)
  if (isError(res) && mainStore.world.name !== name) {
    mainStore.errorWorlds.add(mainStore.world.id)
    return t(`error.${res.key}`)
  }
  else {
    mainStore.errorWorlds.delete(mainStore.world.id)
    mainStore.world.name = name
    return true
  }
}

/**
 * ワールド名の入力欄で取り消しボタンが押された際に、ワールドを起動できなくするためのエラー処理
 */
function clearNewName() {
  // 空文字列のワールドは起動できないため、エラー扱い
  mainStore.errorWorlds.add(mainStore.world.id)
}

/**
 * ワールドコンテナをセットする際に、データの移動を待機する
 */
async function setWorldContainer(container: WorldContainer) {
  // エラーの起きているワールドということにしてワールドの起動を阻止する
  mainStore.errorWorlds.add(mainStore.world.id)
  isWorldContainerLoading.value = true

  const world = deepcopy(mainStore.world)
  world.container = container

  // 保存処理を実行
  const res = await window.API.invokeSetWorld(toRaw(world))
  checkError(
    res.value,
    w => mainStore.updateWorld(w),
    () => { return { title: 'ワールドの保存フォルダを変更できませんでした' } }
  )

  // エラー状態の解除
  mainStore.errorWorlds.delete(world.id)
  isWorldContainerLoading.value = false
}

/**
 * ワールドコンテナの新規作成Dialog
 */
function openFolderEditor() {
  $q.dialog({
    component: AddFolderDialog
  }).onOk((payload: AddFolderDialogReturns) => {
    sysStore.systemSettings.container.push({
      name: payload.name,
      visible: true,
      container: payload.container
    })
  })
}
</script>

<template>
  <q-scroll-area
    ref="scrollAreaRef"
    class="column full-height"
    style="flex: 1 1 0;"
  >
    <div class="mainField">
      <q-item class="q-pa-none q-pt-lg">
        <q-item-section>
          <h1 class="q-pt-none">{{ $T("home.worldName.title") }}</h1>
          <SsInput
            v-model="mainStore.inputWorldName"
            :label="$t('home.worldName.enterName')"
            :debounce="200"
            :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
            :rules="[val => validateWorldName(val)]"
            @clear="clearNewName"
          />

          <h1 class="q-pt-md">{{ $T("home.version.title") }}</h1>
          <VersionSelecterView />

        </q-item-section>
        <q-item-section side top>
          <q-avatar square size="10rem" class="q-ml-lg">
            <q-img
              :src="mainStore.world.avater_path ?? assets.png.unset"
              style="image-rendering: pixelated;"
            />
            <q-btn
              dense
              flat
              size="4.4rem"
              icon=""
              :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
              @click="openIconSelecter"
              class="absolute-center"
            />
          </q-avatar>

          <SsBtn
            :label="$t('home.icon')"
            width="10rem"
            :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
            @click="openIconSelecter"
            class="q-mt-lg"
          />
        </q-item-section>
      </q-item>

      <h1>{{ $t('home.useWorld.title') }}</h1>
      <p class="text-caption">{{ $t('home.useWorld.description') }}</p>
      <SsBtn
        :label="$t('home.useWorld.selectWorld')"
        :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
        @click="openCustomMapImporter"
      />

      <ExpansionView :title="$t('home.saveWorld.title')">
        <p class="text-caption">{{ $t('home.saveWorld.description') }}</p>

        <div class="column q-gutter-y-md">
          <!-- v-modelの書き込みに対応するため、わざとインデックスによる呼び出しを利用 -->
          <template v-for="n in sysStore.systemSettings.container.length" :key="sysStore.systemSettings.container[n-1]">
            <FolderCard
              v-model="sysStore.systemSettings.container[n - 1]"
              :loading="isWorldContainerLoading"
              :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
              :active="mainStore.world.container === sysStore.systemSettings.container[n - 1].container"
              @click="setWorldContainer(sysStore.systemSettings.container[n - 1].container)"
            />
          </template>
          <AddContentsCard
            :label="$t('home.saveWorld.addFolder')"
            min-height="3rem"
            :card-style="{'min-width': '100%', 'border-radius': '5px'}"
            @click="openFolderEditor"
          />
        </div>
      </ExpansionView>

      <ExpansionView :title="$t('home.setting.title')">
        <div class="row" style="max-width: 350px;">
          <SsInput
            v-model="mainStore.world.memory.size"
            :label="$t('home.setting.memSize')"
            :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
            class="col-5 q-pr-md"
          />
          <SsSelect
            v-model="mainStore.world.memory.unit"
            :options="['MB', 'GB', 'TB']"
            :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
            class="col-3"
          />
        </div>

        <SsInput
          v-model="mainStore.world.javaArguments"
          :label="$t('home.setting.jvmArgument')"
          :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
          class="q-pt-md"
        />
      </ExpansionView>
      
      <h1>ワールドの操作</h1>
      <DuplicateWorldView @scroll-top="scrollTop" />
      <BackupWorldView />

      <DangerView
        :view-title="$t('home.deleteWorld.title')"
        :view-desc="$t('home.deleteWorld.titleDesc')"
        :open-dialog-btn-text="$t('home.deleteWorld.button')"
        :dialog-title="$t('home.deleteWorld.dialogTitle')"
        :dialog-desc="$t('home.deleteWorld.dialogDesc', { deleteName: mainStore.world.name })"
        :disable="consoleStore.status(mainStore.world.id) !== 'Stop'"
        @action="removeWorld"
      />
    </div>
  </q-scroll-area>
</template>