<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { versionTypes } from 'app/src-electron/api/schema';
import { useDialogStore } from 'src/stores/DialogStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import PropertyItem from 'src/components/util/propertyItem.vue';
import SsSelect from '../util/base/ssSelect.vue';

const store = useWorldEditStore();

async function updateVersionList() {
  const version = store.world.settings.version
  const versionList = useSystemStore().serverVersions.get(version.type)
  
  // versionListがundefinedの時にエラー処理
  if (versionList === void 0) {
    useDialogStore().showDialog(`サーバーバージョン${version.type}の一覧取得に失敗したため，このサーバーは選択できません`)
    store.world.settings.version.type = 'vanilla'
    return
  }

  // Version Listに選択されていたバージョンがない場合や、新規ワールドの場合は最新バージョンを提示
  if (version.id == '' || versionList.every(ver => ver.id != version.id))
    store.world.settings.version.id = versionList[0].id
}
onBeforeMount(updateVersionList);
</script>

<template>
  <PropertyItem propName="name">
    <template v-slot:userInput>
      <!-- TODO: ワールド名のバリデーション -->
      <q-input
        v-model="store.world.name"
        clearable
        style="width: 300px"
      />
    </template>
  </PropertyItem>

  <PropertyItem propName="version">
    <template v-slot:userInput>
      <SsSelect
        v-model="store.world.settings.version.type"
        :options="versionTypes"
        @update:model-value="updateVersionList"
        label="サーバー"
        style="width: 150px"
        class="q-pr-lg"
      />
      <SsSelect
        v-model="store.world.settings.version.id"
        :options="useSystemStore().serverVersions.get(store.world.settings.version.type)?.map((ver) => ver.id)"
        label="バージョン"
        style="width: 150px"
        class="q-pr-lg"
      />
    </template>
  </PropertyItem>

  <!-- <PropertyItem propName="world type">
    <template v-slot:userInput>
      <q-select
        v-model="serverProperty"
        :options="worldTypes"
        label="ワールドタイプ"
        style="width: 150px"
      />
    </template>
  </PropertyItem> -->
</template>