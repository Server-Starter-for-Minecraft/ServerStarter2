<script setup lang="ts">
import { Ref, ref } from 'vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import PropertyItem from 'src/components/util/propertyItem.vue';
import { useSystemStore } from 'src/stores/SystemStore';
import { useWorldEditStore } from 'src/stores/WorldEditStore';
import { OpLevel } from 'app/src-electron/schema/player';
import { useDialogStore } from 'src/stores/DialogStore';

const store = useWorldEditStore()
const sysStore = useSystemStore()

const players = sysStore.systemSettings.player.players.map(p => p.name)
const groups  = sysStore.systemSettings.player.groups.map(g => g.name)

const opLevels = [
  {label: '未設定', value: 'unset'},
  {label: '1', value: '1'},
  {label: '2', value: '2'},
  {label: '3', value: '3'},
  {label: '4', value: '4'},
]

const addGroup  = ref(false)
const name = ref(players[0])
const opLevel: Ref<OpLevel | 'unset'> = ref(4)
const whiteList = ref(true)

function regist() {
  if (addGroup.value) {
    if (store.groupRows.map(g => g.name).includes(name.value)) {
      useDialogStore().showDialog(`${name.value}はグループ一覧にすでに登録されています`)
    }
    else {
      const group = {
        name: name.value,
        op: opLevel.value,
        white_list: whiteList.value
      }
      store.groupRows.push(group)
    }
  }
  else {
    if (store.playerRows.map(p => p.name).includes(name.value)) {
      useDialogStore().showDialog(`${name.value}はプレイヤー一覧にすでに登録されています`)
    }
    else {
      const player = {
        name: name.value,
        op: opLevel.value,
        white_list: whiteList.value,
        group: false
      }
      store.playerRows.push(player)
    }
  }
}
</script>

<template>
  <q-expansion-item
    label="リストに追加"
    header-style="font-size: 1.5rem"
    :default-opened="store.playerRows.length===0 && store.groupRows.length===0"
  >
    <div class="center">
      <PropertyItem prop-name="追加のやり方">
        <template v-slot:userInput>
          <q-toggle v-model="addGroup" :label="addGroup ? 'グループ単位' : 'プレイヤー単位'" @update:model-value="name = (addGroup ? groups : players)[0]" size="3rem" style="font-size: 1.2rem;"/>
        </template>
      </PropertyItem>
      <PropertyItem :prop-name="addGroup ? 'グループ名' : 'プレイヤー名'">
        <template v-slot:userInput>
          <SsSelect v-model="name" label="名称" :options="addGroup ? groups : players" class="select"/>
        </template>
      </PropertyItem>
      <PropertyItem prop-name="OPレベル">
        <template v-slot:userInput>
          <SsSelect v-model="opLevel" label="OP" :options="opLevels" class="select"/>
        </template>
      </PropertyItem>
      <PropertyItem prop-name="ホワイトリスト">
        <template v-slot:userInput>
          <q-toggle v-model="whiteList" :label="whiteList ? 'ホワイトリストに登録する' : 'ホワイトリストに登録しない'" size="3rem" style="font-size: 1.2rem;"/>
        </template>
      </PropertyItem>

      <div class="text-right q-pb-md">
        <q-btn color="primary" size="1rem" label="登録" @click="regist"/>
      </div>
    </div>
  </q-expansion-item>
</template>

<style scoped lang="scss">
.center {
  margin: 0 auto;
  width: max-content;
}

.select {
  width: max-content;
  min-width: 300px;
}
</style>