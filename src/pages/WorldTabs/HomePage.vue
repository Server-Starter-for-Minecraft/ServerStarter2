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
import { values } from 'src/scripts/obj';
import { useWorldStore } from 'src/stores/MainStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';

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
  const worldStore = useWorldStore()

  if (mainStore.newWorlds.has(mainStore.world.id)) {
    mainStore.removeWorld()
    mainStore.setWorld(values(worldStore.worldList)[0])
  }
  else {
    const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID)
    if (!isError(res)) {
      dialogStore.showDialog('home.error.title', 'home.error.failedDelete', { serverName: mainStore.world.name })
    }
    else {
      mainStore.removeWorld()
      mainStore.setWorld(values(worldStore.worldList)[0])
    }
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
    mainStore.errorWorlds.add(mainStore.world.id)
    return t(res.key)
  }
  else {
    mainStore.errorWorlds.delete(mainStore.world.id)
    mainStore.world.name = name
    return true
  }
}
</script>

<template>
  <div class="mainField">
    <q-item class="q-pa-none q-pt-lg">
      <q-item-section>
        <h1 class="q-pt-none">{{ $t("home.worldName.title") }}</h1>
        <SsInput
          v-model="mainStore.inputWorldName"
          :label="$t('home.worldName.enterName')"
          :debounce="200"
          :rules="[val => validateWorldName(val)]"
          @clear="() => { mainStore.inputWorldName = '' as WorldName }"
        />
        <!-- TODO: バージョン一覧の取得 -->
        <h1 class="q-pt-md">{{ $t("home.version.title") }}</h1>
        <SsSelect
          v-model="mainStore.world.version.type"
          @update:model-value="getAllVers"
          :options="versionTypes"
          :label="$t('home.version.serverType')"
          class="q-pb-md"
        />
        <SsSelect
          v-model="mainStore.world.version.id"
          :options="sysStore.serverVersions.get(mainStore.world.version.type)?.map(ver => ver.id)"
          :label="$t('home.version.versionType')"
        />
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

    <!-- TODO: 配布ワールドは新規World以外でも導入できるようにするのか？ -->
    <!-- TODO: 配布ワールドだけでなく、既存の個人ワールドについても.minecraftがある場合は導入できるようにする？ -->
    <!-- 個人ワールドのデフォルトパスは変更できるようにする -->
    <h1>{{ $t('home.useWorld.title') }}</h1>
    <p class="text-caption">{{ $t('home.useWorld.description') }}</p>
    <SsBtn
      :label="$t('home.useWorld.selectWorld')"
      @click="() => {}"
    />

    <ExpansionView :title="$t('home.saveWorld.title')">
      <p class="text-caption">{{ $t('home.saveWorld.description') }}</p>
    </ExpansionView>

    <!-- TODO: memoryがsizeとunitのpropertyを有していないバグをバックに報告 -->
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