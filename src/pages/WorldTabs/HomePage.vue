<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useQuasar } from 'quasar';
import { WorldName } from 'app/src-electron/schema/brands';
import { versionTypes } from 'app/src-electron/schema/version';
import { assets } from 'src/assets/assets';
import { isError } from 'src/scripts/error';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useDialogStore } from 'src/stores/DialogStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ExpansionView from 'src/components/World/HOME/expansionView.vue';
import DangerView from 'src/components/util/dangerView.vue';
import IconSelectView from 'src/components/World/HOME/IconSelectView.vue';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const sysStore = useSystemStore()
const dialogStore = useDialogStore()
const $q = useQuasar()
const { t } = useI18n()

const customWorldPath = ref(null)
const soloWorldName = ref(t('home.useWorld.solo'))
const showSoloWorld = ref(false)

/**
 * バージョンの一覧を取得する
 */
function getAllVers() {
  const version = mainStore.world.version;
  const versionList = sysStore.serverVersions.get(version.type);

  // versionListがundefinedの時にエラー処理
  if (versionList === void 0) {
    dialogStore.showDialog('home.error.title', 'home.error.failedGetVersion', { serverVersion: mainStore.world.version });
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
  const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID)
  if (!isError(res)) {
    dialogStore.showDialog('home.error.title', 'home.error.failedDelete', { serverName: mainStore.world.name })
  }
  else {
    mainStore.removeWorld()
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
 * ワールド名のバリデーションを行う
 */
async function validateWorldName(name: WorldName) {
  const res = await window.API.invokeValidateNewWorldName(mainStore.world.container, name)
  if (isError(res) && mainStore.world.name !== name) {
    return res.key
  }
  else {
    mainStore.world.name = name
    return true
  }
}
</script>

<template>
  <div class="mainField">
    <q-item class="q-pa-none">
      <q-item-section>
        <!-- TODO: 入力欄のバリデーション -->
        <!-- TODO: 入力をWorldに即座に反映せず、入力終了時に反映する -->
        <h1 class="q-mt-none">{{ $t("home.worldName.title") }}</h1>
        <SsInput
          v-model="mainStore.inputWorldName"
          :label="$t('home.worldName.enterName')"
          :debounce="200"
          :rules="[val => validateWorldName(val)]"
          @clear="() => { mainStore.inputWorldName = '' as WorldName }"
        />
      </q-item-section>
      <q-item-section side>
        <q-avatar square size="5rem" class="q-ml-lg">
          <q-img :src="mainStore.world.avater_path ?? assets.svg.defaultWorldIcon" />
          <q-btn
            dense
            outline
            size="2.5rem"
            icon=""
            @click="openIconSelecter"
            class="absolute-center"
          />
        </q-avatar>
      </q-item-section>
    </q-item>

    <!-- TODO: バージョン一覧の取得 -->
    <h1>{{ $t("home.version.title") }}</h1>
    <div class="row">
      <SsSelect
        v-model="mainStore.world.version.type"
        @update:model-value="getAllVers"
        :options="versionTypes"
        :label="$t('home.version.serverType')"
        class="col-5 q-pr-md"
      />
      <SsSelect
        v-model="mainStore.world.version.id"
        :options="sysStore.serverVersions.get(mainStore.world.version.type)?.map(ver => ver.id)"
        :label="$t('home.version.versionType')"
        class="col"
      />
    </div>

    <!-- TODO: 配布ワールドは新規World以外でも導入できるようにするのか？ -->
    <!-- TODO: 配布ワールドだけでなく、既存の個人ワールドについても.minecraftがある場合は導入できるようにする？ -->
    <!-- 個人ワールドのデフォルトパスは変更できるようにする -->
    <ExpansionView :title="$t('home.useWorld.title')">
      <q-toggle v-model="showSoloWorld" :label="showSoloWorld ? $t('home.useWorld.solo') : $t('home.useWorld.custom')"/>
      <p v-show="!showSoloWorld" class="text-caption q-ma-none q-mt-md">{{ $t("home.useWorld.descCustom") }}</p>
      <p v-show="showSoloWorld" class="text-caption q-ma-none q-mt-md">{{ $t("home.useWorld.descSolo") }}</p>
      <q-file
        v-show="!showSoloWorld"
        v-model="customWorldPath"
        :label="$t('home.useWorld.pickCustom')"
        clearable
        accept=".zip"
      >
        <template v-slot:prepend>
          <q-icon name="attach_file" />
        </template>
      </q-file>
      <SsSelect v-show="showSoloWorld" v-model="soloWorldName" />
    </ExpansionView>
    <!-- <input type="file" webkitdirectory directory multiple/> -->

    <!-- TODO: memoryがsizeとunitのpropertyを有していないバグをバックに報告 -->
    <ExpansionView :title="$t('home.setting.title')">
      <div class="row" style="max-width: 300px;">
        <SsInput
          v-model="mainStore.world.memory.size"
          :label="$t('home.setting.memSize')"
          class="col q-pr-md"
        />
        <SsSelect
          v-model="mainStore.world.memory.unit"
          :options="['MB', 'GB', 'TB']"
          :label="$t('home.setting.unit')"
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
      :title="$t('home.deleteWorld.title')"
      i18nKey="home.deleteWorld.titleDesc"
      :btn-text="$t('home.deleteWorld.button')"
      @action="removeWorld"
      show-dialog
      dialog-title-key="home.deleteWorld.dialogTitle"
      dialog-i18n-key="home.deleteWorld.dialogDesc"
      :dialog-i18n-arg="{ deleteName: mainStore.world.name }"
    />
  </div>
</template>