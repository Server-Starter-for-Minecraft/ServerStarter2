<script setup lang="ts">
import { ref } from 'vue';
import { thumbStyle } from '../scrollBar';

interface Group {
  name: string
  label: string
}

const menuLink = ref('')

const groupNames: Group[] = [
  {
    name: '',
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
    name: 'generation',
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
          v-ripple
          :to="group.name"
          :active="menuLink === group.name"
          @click="menuLink = group.name"
        >
          <q-item-section style="width: max-content;">{{ group.label }}</q-item-section>
        </q-item>
      </template>
    </q-scroll-area>
  </div>
</template>