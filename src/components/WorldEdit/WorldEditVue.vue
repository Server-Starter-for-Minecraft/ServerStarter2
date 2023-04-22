<script setup lang="ts">
import { onBeforeMount, ref } from 'vue';
import { Version, versionTypes } from 'app/src-electron/api/scheme.js';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import propertyItem from 'src/components/util/propertyItem.vue';
import propertyTable from './PropertyTable.vue';
import { checkError } from '../Error/Error';

interface Props {
  saveFunc: () => void
}
defineProps<Props>()

async function updateVersionList() {
  await window.API.invokeGetVersions(
    store.world.settings.version.type
  ).then(res => {
    checkError(
      res,
      (checked) => versionList.value = checked
    );
  })
}
onBeforeMount(updateVersionList)

const store = useWorldEditStore()
const versionList = ref([] as Version[])
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
            :options="versionList.map(ver => ver.id)"
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
    <propertyTable/>
    
    <h1 id="PersonList">Person List</h1>
    <h1 id="AdditionalList">Additional List</h1>
    <h1 id="ShareWorld">ShareWorld</h1>

    <q-btn color="primary" label="保存" to="/" replace @click="saveFunc"/>

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