<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { versionTypes } from 'app/src-electron/schema/version';
import { useDialogStore } from 'src/stores/DialogStore';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import PropertyItem from 'src/components/util/propertyItem.vue';
import SsSelect from '../util/base/ssSelect.vue';
import SsInput from '../util/base/ssInput.vue';
import TitleVue from './TitleVue.vue';

const store = useWorldEditStore();

function checkWorldName(name: string) {
  return name.match(/^[0-9a-zA-Z_-]+$/) !== null
}

async function updateVersionList() {
  const version = store.world.version;
  const versionList = useSystemStore().serverVersions.get(version.type);

  // versionListがundefinedの時にエラー処理
  if (versionList === void 0) {
    useDialogStore().showDialog(
      `サーバーバージョン${version.type}の一覧取得に失敗したため，このサーバーは選択できません`
    );
    store.world.version.type = 'vanilla';
    return;
  }

  // Version Listに選択されていたバージョンがない場合や、新規ワールドの場合は最新バージョンを提示
  if (version.id == '' || versionList.every((ver) => ver.id != version.id))
    store.world.version.id = versionList[0].id;
}
onBeforeMount(updateVersionList);
</script>

<template>
  <TitleVue title="General"/>

  <div class="center">
    <PropertyItem propName="name">
      <template v-slot:userInput>
        <SsInput
          v-model="store.world.name"
          label="ワールド名"
          :rules="[
            val => checkWorldName(val) || 'ワールド名は半角英数字でなければなりません'
          ]"
          style="width: 300px"
        />
      </template>
    </PropertyItem>

    <PropertyItem propName="version">
      <template v-slot:userInput>
        <SsSelect
          v-model="store.world.version.type"
          :options="versionTypes"
          @update:model-value="updateVersionList"
          label="サーバー"
          style="width: 150px"
          class="q-pr-lg"
        />
        <SsSelect
          v-model="store.world.version.id"
          :options="
            useSystemStore()
              .serverVersions.get(store.world.version.type)
              ?.map((ver) => ver.id)
          "
          label="バージョン"
          style="width: 150px"
          class="q-pr-lg"
        />
      </template>
    </PropertyItem>

    <!-- TODO: Worldオブジェクトにメモリの規定値を割り当てることを要請 -->
    <PropertyItem prop-name="memory size">
      <template v-slot:userInput>
        <!-- <SsInput
          v-model="store.world.memory?.size"
          label="大きさ"
          class="q-pr-md"
          style="width: 100px"
        />
        <SsSelect
          v-model="store.world.memory?.unit"
          :options="['MB', 'GB', 'TB']"
          label="単位"
          style="width: 100px"
        /> -->
      </template>
    </PropertyItem>
  </div>
</template>

<style scoped lang="scss">
.center {
  margin: 0 auto;
  width: max-content;
}
</style>
