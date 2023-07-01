<script setup lang="ts">
import { ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import BasePlayerCard from './utils/BasePlayerCard.vue';
import GroupEditorView from './Editor/GroupEditorView.vue';
import GroupCardMenu from './utils/GroupCardMenu.vue';

interface Prop {
  name: string
  color: string
  players: PlayerUUID[]
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const mainStore = useMainStore()
const playerStore = usePlayerStore()
const showMenuBtn = ref(false)
const menuOpened = ref(false)
const showEditor = ref(false)

function onCardClicked() {
  prop.players.forEach(uuid => {
    // プレイヤー一覧にグループメンバーが表示されていないときは一覧に追加
    if (!mainStore.world().players.map(p => p.uuid).includes(uuid)) {
      mainStore.world().players.push({ uuid: uuid })
    }
    
    // グループプレイヤー全員にFocusを当てる
    if (!playerStore.focusCards.includes(uuid)) {
      playerStore.focusCards.push(uuid)
    }
  });
}

function removeGroup() {
  delete sysStore.systemSettings().player.groups[prop.name]
}
</script>

<template>
  <base-player-card
    @mouseover="showMenuBtn = true"
    @mouseout="showMenuBtn  = false"
    @click="onCardClicked"
  >
    <template #default>
      <q-card-section
        horizontal
        :style="{'border-left': `1.5rem solid ${color}`, 'border-radius': '15px'}"
      >
        <q-card-section class="q-pt-sm">
          <div class="groupName">{{ name }}</div>
  
          <!-- TODO: 大量のプレイヤーが存在する（カードの高さが一定以上になる？）場合には折り畳みにすることを検討？ -->
          <div class="row q-gutter-md q-pt-sm">
            <template v-for="uuid in players" :key="uuid">
              <player-head-view :uuid="uuid" size="1.5rem" />
            </template>
          </div>
        </q-card-section>
      </q-card-section>
    </template>

    <template #actions>
      <q-btn
        v-show="showMenuBtn || menuOpened"
        flat
        dense
        icon="more_vert"
        class="q-mt-sm q-mr-sm absolute-top-right"
      >
        <q-menu
          v-model="menuOpened"
          anchor="top right"
          self="top left"
        >
          <q-list dense>
            <group-card-menu icon="edit" text="編集" @click="showEditor = true" />
            <group-card-menu icon="delete" text="削除" @click="removeGroup" />
          </q-list>
        </q-menu>
      </q-btn>
    </template>
  </base-player-card>

  <!-- グループ編集画面 -->
  <group-editor-view v-model="showEditor" :group-name="name" />
</template>

<style scoped lang="scss">
.groupName {
  font-size: 1.5rem;
}
</style>