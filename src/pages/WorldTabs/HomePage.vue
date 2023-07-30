<script setup lang="ts">
import { toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { WorldName } from 'app/src-electron/schema/brands';
import { assets } from 'src/assets/assets';
import { checkError } from 'src/components/Error/Error';
import { CustomMapImporterReturns } from 'src/components/World/HOME/CustomMapImporter/iCustomMapImporter';
import { AddFolderDialogReturns } from 'src/components/SystemSettings/Folder/iAddFolder';
import { isError } from 'src/scripts/error';
import { values } from 'src/scripts/obj';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldStore } from 'src/stores/MainStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
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

const sysStore = useSystemStore()
const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const $q = useQuasar()
const { t } = useI18n()

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
    mainStore.setWorld(values(worldStore.sortedWorldList)[0])
  }

  if (mainStore.newWorlds.has(mainStore.world.id)) {
    updateView()
  }
  else {
    const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID)
    checkError(
      res.value,
      updateView,
      () => { return { title: t('home.error.failedDelete', { serverName: mainStore.world.name }) } }
    )
  }
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
  }).onOk((payload: CustomMapImporterReturns) => {
    mainStore.world.custom_map = payload.customMap
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
 * NewWorldを保存する
 */
async function saveNewWorld() {
  const res = await window.API.invokeCreateWorld(toRaw(mainStore.world))
  checkError(
    res.value,
    w => mainStore.newWorlds.delete(w.id),
    () => { return { title: 'ワールドの保存に失敗しました' }}
  )
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
  <div class="mainField">
    <q-item class="q-pa-none q-pt-lg">
      <q-item-section>
        <div
          v-show="mainStore.newWorlds.has(mainStore.world.id)"
          class="row q-pb-md q-gutter-md"
        >
          <SsBtn
            free-width
            :label="$t('home.init.save')"
            color="primary"
            class="col"
            @click="saveNewWorld"
          />
          <SsBtn
            free-width
            :label="$t('home.init.discard')"
            color="red"
            class="col"
            @click="removeWorld"
          />
        </div>

        <h1 class="q-pt-none">{{ $t("home.worldName.title") }}</h1>
        <SsInput
          v-model="mainStore.inputWorldName"
          :label="$t('home.worldName.enterName')"
          :debounce="200"
          :rules="[val => validateWorldName(val)]"
          @clear="clearNewName"
        />

        <h1 class="q-pt-md">{{ $t("home.version.title") }}</h1>
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
            @click="openIconSelecter"
            class="absolute-center"
          />
        </q-avatar>

        <SsBtn
          :label="$t('home.icon')"
          width="10rem"
          @click="openIconSelecter"
          class="q-mt-lg"
        />
      </q-item-section>
    </q-item>

    <h1>{{ $t('home.useWorld.title') }}</h1>
    <p class="text-caption">{{ $t('home.useWorld.description') }}</p>
    <SsBtn
      :label="$t('home.useWorld.selectWorld')"
      @click="openCustomMapImporter"
    />

    <ExpansionView :title="$t('home.saveWorld.title')">
      <p class="text-caption">{{ $t('home.saveWorld.description') }}</p>

      <div class="column q-gutter-y-md">
        <template v-for="n in sysStore.systemSettings.container.length" :key="sysStore.systemSettings.container[n-1]">
          <FolderCard
            v-model="sysStore.systemSettings.container[n - 1]"
            :active="mainStore.world.container === sysStore.systemSettings.container[n - 1].container"
            @click="mainStore.world.container = sysStore.systemSettings.container[n - 1].container"
          />
        </template>
        <AddContentsCard
          label="ワールドフォルダを追加"
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
          class="col-5 q-pr-md"
        />
        <SsSelect
          v-model="mainStore.world.memory.unit"
          :options="['MB', 'GB', 'TB']"
          class="col-3"
        />
      </div>

      <SsInput
        v-model="mainStore.world.javaArguments"
        :label="$t('home.setting.jvmArgument')"
        class="q-pt-md"
      />
    </ExpansionView>

    <DangerView
      v-if="consoleStore.status() === 'Stop'"
      :view-title="$t('home.deleteWorld.title')"
      :view-desc="$t('home.deleteWorld.titleDesc')"
      :open-dialog-btn-text="$t('home.deleteWorld.button')"
      :dialog-title="$t('home.deleteWorld.dialogTitle')"
      :dialog-desc="$t('home.deleteWorld.dialogDesc', { deleteName: mainStore.world.name })"
      @action="removeWorld"
    />
  </div>
</template>