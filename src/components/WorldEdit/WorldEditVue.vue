<script setup lang="ts">
import { onBeforeMount } from 'vue';
import { versionTypes } from 'app/src-electron/api/schema';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useDialogStore } from 'src/stores/DialogStore';
import propertyItem from 'src/components/util/propertyItem.vue';
import propertyTable from './PropertyTable.vue';

interface Props {
  saveFunc: () => void;
}
defineProps<Props>();

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
  <q-page class="mainField center">
    <propertyItem propName="name">
      <template v-slot:userInput>
        <!-- TODO: ワールド名のバリデーション -->
        <q-input
          v-model="store.world.name"
          clearable
          label="ワールド名"
          style="width: 300px"
        />
      </template>
    </propertyItem>

    <propertyItem propName="version">
      <template v-slot:userInput>
        <q-select
          v-model="store.world.settings.version.type"
          :options="versionTypes"
          @update:model-value="updateVersionList"
          label="サーバー"
          style="width: 150px"
          class="q-pr-lg"
        />
        <q-select
          v-model="store.world.settings.version.id"
          :options="useSystemStore().serverVersions.get(store.world.settings.version.type)?.map((ver) => ver.id)"
          label="バージョン"
          style="width: 150px"
          class="q-pr-lg"
        />
      </template>
    </propertyItem>

    <!-- <propertyItem propName="world type">
      <template v-slot:userInput>
        <q-select
          v-model="serverProperty"
          :options="worldTypes"
          label="ワールドタイプ"
          style="width: 150px"
        />
      </template>
    </propertyItem> -->

    <h1 id="Property">Property</h1>
    <propertyTable />

    <h1 id="PersonList">Person List</h1>
    <h1 id="AdditionalList">Additional List</h1>
    <h1 id="ShareWorld">ShareWorld</h1>

    <q-btn color="primary" label="保存" to="/" replace @click="saveFunc" />
  </q-page>
</template>

<style scoped lang="scss">
h1 {
  font-size: 26pt;
}
.center {
  margin: 0 auto;
  width: max-content;
}
</style>
