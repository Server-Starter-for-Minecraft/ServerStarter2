<script setup lang="ts">
import { toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { WorldName } from 'app/src-electron/schema/brands';
import { assets } from 'src/assets/assets';
import { checkError, sendError } from 'src/components/Error/Error';
import { CustomMapImporterReturns } from 'src/components/World/HOME/CustomMapImporter/iCustomMapImporter';
import { isError } from 'src/scripts/error';
import { values } from 'src/scripts/obj';
import { useWorldStore } from 'src/stores/MainStore';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ExpansionView from 'src/components/World/HOME/expansionView.vue';
import DangerView from 'src/components/util/danger/dangerView.vue';
import IconSelectView from 'src/components/World/HOME/IconSelectView.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CustomMapImporterView from 'src/components/World/HOME/CustomMapImporterView.vue';
import VersionSelecterView from 'src/components/World/HOME/VersionSelecterView.vue';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const sysStore = useSystemStore()
const $q = useQuasar()
const { t } = useI18n()

/**
 * バージョンの一覧を取得する
 */
function getAllVers() {
  const version = mainStore.world.version;
  const versionList = sysStore.serverVersions.get(version.type);

  // versionListがundefinedの時にエラー処理
  if (versionList === void 0) {
    sendError(
      t('home.error.title'),
      t('home.error.failedGetVersion', { serverVersion: mainStore.world.version })
    );
    mainStore.world.version.type = 'vanilla';
    return;
  }

  // Version Listに選択されていたバージョンがない場合や、新規ワールドの場合は最新バージョンを提示
  if (version.id == '' || versionList.every((ver) => ver.id != version.id))
    mainStore.world.version.id = versionList[0].id;
}

/**
 * 選択されているワールドを削除する
 */
async function removeWorld() {
  /** 描画の更新 */
  function updateView() {
    const worldStore = useWorldStore()
    mainStore.removeWorld()
    mainStore.setWorld(values(worldStore.worldList)[0])
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
</script>

<template>
  <div class="mainField">
    <q-item class="q-pa-none q-pt-lg">
      <q-item-section>
        <!-- TODO: ボタンのサイズを自動で決定 -->
        <div
          v-show="mainStore.newWorlds.has(mainStore.world.id)"
          class="row justify-between full-width q-pb-md"
        >
          <SsBtn
            label="ワールドの設定を保存"
            color="primary"
            width="48%"
            @click="saveNewWorld"
          />
          <!-- TODO: NewWorldを削除すると、ワールド一覧に何も表示されなくなる場合には削除できないようにする？ -->
          <SsBtn
            label="ワールドの設定を破棄"
            color="red"
            width="48%"
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