<script setup lang="ts">
import { ref } from 'vue';
import { useWorldTabsStore } from 'src/stores/WorldTabsStore';
import { thumbStyle } from '../scrollBar';

interface Group {
  name: string
  label: string
}

const worldStore = useWorldTabsStore()

const menuLink = ref('base')

// TODO: 将来的にnameはclassifications.tsから取得し、labelはi18nからnameをkeyとして取得
const groupNames: Group[] = [
  {
    name: 'base',
    label: '基本設定'
  },
  {
    name: 'player',
    label: 'プレイヤー'
  },
  {
    name: 'server',
    label: 'サーバー'
  },
  {
    name: 'generater',
    label: 'ワールド生成'
  },
  {
    name: 'spawning',
    label: 'ワールドスポーン'
  },
  {
    name: 'world',
    label: 'ワールド本体'
  },
  {
    name: 'network',
    label: 'ネットワーク'
  },
  {
    name: 'rcon-query',
    label: 'RCON / Query'
  },
  {
    name: 'command',
    label: 'コマンド'
  },
  {
    name: 'resourcepack',
    label: 'リソースパック'
  },
  {
    name: 'security',
    label: 'セキュリティ'
  },
  {
    name: 'other',
    label: 'その他'
  }
]

function groupClicked(selectedGroupName: string) {
  menuLink.value = selectedGroupName
  worldStore.property.selectTab = selectedGroupName
}
</script>

<template>
  <div style="width: 170px;">
    <q-scroll-area
      :thumb-style="thumbStyle"
      class="fit"
    >
      <template v-for="group in groupNames" :key="group">
        <q-item
          clickable
          :active="menuLink === group.name"
          @click="() => groupClicked(group.name)"
        >
          <q-item-section style="width: max-content;">{{ group.label }}</q-item-section>
        </q-item>
      </template>
    </q-scroll-area>
  </div>
</template>