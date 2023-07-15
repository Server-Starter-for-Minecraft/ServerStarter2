<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { iEditorDialogReturns, generateGroup, iEditorDialogProps } from './Editor/editorDialog';
import PlayerHeadView from './utils/PlayerHeadView.vue';
import GroupEditorView from './Editor/GroupEditorView.vue';
import GroupCardMenu from './utils/GroupCardMenu.vue';
import BaseActionsCard from '../utils/BaseActionsCard.vue';

interface Prop {
  name: string
  color: string
  players: PlayerUUID[]
}
const prop = defineProps<Prop>()

const $q = useQuasar()
const sysStore = useSystemStore()
const playerStore = usePlayerStore()
const showMenuBtn = ref(false)
const menuOpened = ref(false)

const cachePlayers = ref(playerStore.cachePlayers)

async function onCardClicked() {
  playerStore.selectGroup(prop.name)
}

function removeGroup() {
  delete sysStore.systemSettings().player.groups[prop.name]
}

function openEditor() {
  $q.dialog({
    component: GroupEditorView,
    componentProps: {
      groupName: prop.name,
      groupColor: prop.color,
      members: prop.players
    } as iEditorDialogProps
  }).onOk((payload: iEditorDialogReturns) => {
    // グループを更新する際には、元のグループを削除してグループを再登録する
    delete sysStore.systemSettings().player.groups[prop.name]

    // グループの登録
    generateGroup(payload.name, payload.color, payload.members)
  })
}
</script>

<template>
  <BaseActionsCard
    @mouseover="showMenuBtn = true"
    @mouseout="showMenuBtn  = false"
    @click="onCardClicked"
  >
    <template #default>
      <q-card-section
        horizontal
        class="fit"
        :style="{'border-left': `1.5rem solid ${color}`, 'border-radius': '15px'}"
      >
        <q-card-section class="q-pt-sm">
          <div class="groupName">{{ name }}</div>

          <!-- TODO: 大量のプレイヤーが存在する（カードの高さが一定以上になる？）場合には折り畳みにすることを検討？ -->
          <div class="row q-gutter-md q-pt-sm">
            <template v-for="uuid in players" :key="uuid">
              <player-head-view v-model="cachePlayers[uuid]" size="1.5rem" />
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
            <group-card-menu icon="edit" :text="$t('player.edit')" @click="openEditor" />
            <group-card-menu icon="delete" :text="$t('player.delete')" @click="removeGroup" />
          </q-list>
        </q-menu>
      </q-btn>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.groupName {
  font-size: 1.5rem;
}
</style>