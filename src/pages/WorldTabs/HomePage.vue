<script setup lang="ts">
import { ref } from 'vue';
import { versionTypes } from 'app/src-electron/schema/version';
import { useMainStore } from 'src/stores/MainStore';
import { useConsoleStore } from 'src/stores/ConsoleStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useDialogStore } from 'src/stores/DialogStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ExpansionView from 'src/components/World/HOME/expansionView.vue';
import DangerView from 'src/components/util/dangerView.vue';
import { isFailure } from 'app/src-electron/api/failable';
import { deleteWorld } from 'app/src-electron/core/world/world';
import { dialog } from 'electron';

const mainStore = useMainStore()
const consoleStore = useConsoleStore()
const sysStore = useSystemStore()
const dialogStore = useDialogStore()

const customWorldPath = ref(null)
const soloWorldName = ref('個人ワールドを選択')
const showSoloWorld = ref(false)

/**
 * バージョンの一覧を取得する
 */
function getAllVers() {
  const version = mainStore.world().version;
  const versionList = sysStore.serverVersions.get(version.type);

  // versionListがundefinedの時にエラー処理
  if (versionList === void 0) {
    dialogStore.showDialog(
      '警告',
      [`サーバーバージョン${version.type}の一覧取得に失敗したため，このサーバーは選択できません`]
    );
    mainStore.world().version.type = 'vanilla';
    return;
  }

  // Version Listに選択されていたバージョンがない場合や、新規ワールドの場合は最新バージョンを提示
  if (version.id == '' || versionList.every((ver) => ver.id != version.id))
    mainStore.world().version.id = versionList[0].id;
}

/**
 * 選択されているワールドを削除する
 */
async function removeWorld() {
  const res = await window.API.invokeDeleteWorld(mainStore.selectedWorldID)
  if (isFailure(res)) {
    dialogStore.showDialog('failDelete.title', 'failDelete.description', { deleteName: mainStore.world().name })
  }
  else {
    mainStore.removeWorld()
  }
}
</script>

<template>
  <div class="mainField">
    <!-- TODO: 入力欄のバリデーション -->
    <h1 class="q-mt-none">{{ $t("home.worldName") }}</h1>
    <SsInput
      v-model="mainStore.world().name"
      label="半角英数字でワールド名を入力"
    />

    <!-- TODO: バージョン一覧の取得 -->
    <h1>バージョン</h1>
    <div class="row">
      <SsSelect
        v-model="mainStore.world().version.type"
        @update:model-value="getAllVers"
        :options="versionTypes"
        label="サーバーの種類を選択"
        class="col-5 q-pr-md"
      />
      <SsSelect
        v-model="mainStore.world().version.id"
        :options="sysStore.serverVersions.get(mainStore.world().version.type)?.map(ver => ver.id)"
        label="バージョンを選択"
        class="col"
      />
    </div>

    <!-- TODO: 配布ワールドは新規World以外でも導入できるようにするのか？ -->
    <!-- TODO: 配布ワールドだけでなく、既存の個人ワールドについても.minecraftがある場合は導入できるようにする？ -->
    <!-- 個人ワールドのデフォルトパスは変更できるようにする -->
    <ExpansionView title="既存ワールドの導入">
      <q-toggle v-model="showSoloWorld" :label="showSoloWorld ? '個人ワールドを導入する' : '配布ワールドをZipファイルより導入する'"/>
      <p v-show="!showSoloWorld" class="text-caption q-ma-none q-mt-md">インターネットよりダウンロードしたワールド（配布ワールド）を導入する</p>
      <p v-show="showSoloWorld" class="text-caption q-ma-none q-mt-md">このPC上にあるMinecraftの個人ワールドを導入する</p>
      <q-file
        v-show="!showSoloWorld"
        v-model="customWorldPath"
        label="配布ワールド(.zip)を選択"
        clearable
        accept=".zip"
      >
        <template v-slot:prepend>
          <q-icon name="attach_file" />
        </template>
      </q-file>
      <SsSelect v-show="showSoloWorld" v-model="soloWorldName"/>
    </ExpansionView>
    <!-- <input type="file" webkitdirectory directory multiple/> -->

    <!-- TODO: memoryがsizeとunitのpropertyを有していないバグをバックに報告 -->
    <ExpansionView title="起動設定">
      <div class="row" style="max-width: 300px;">
        <SsInput
          v-model="mainStore.world().memory.size"
          label="メモリサイズ"
          class="col q-pr-md"
        />
        <SsSelect
          v-model="mainStore.world().memory.unit"
          :options="['MB', 'GB', 'TB']"
          label="単位"
          class="col-3"
        />
      </div>

      <SsInput
        v-model="mainStore.world().javaArguments"
        label="JVM引数"
        class="q-pt-md"
      />
    </ExpansionView>

    <DangerView
      v-if="consoleStore.status() === 'Stop'"
      :title="$t('deleteWorld.title')"
      i18nKey="deleteWorld.titleExplanation"
      :btn-text="$t('deleteWorld.dialogTitle')"
      @action="removeWorld"
      show-dialog
      dialog-title-key="deleteWorld.dialogTitle"
      dialog-i18n-key="deleteWorld.dialogExplanation"
      :dialog-i18n-arg="{ deleteName: mainStore.world().name }"
    />
  </div>
</template>