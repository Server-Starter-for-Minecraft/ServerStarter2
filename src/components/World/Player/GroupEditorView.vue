<script setup lang="ts">
import { toRaw } from 'vue';
import { PlayerGroup } from 'app/src-electron/schema/player';
import { keys } from 'src/scripts/obj';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import { useSystemStore } from 'src/stores/SystemStore';
import SsInput from 'src/components/util/base/ssInput.vue';

const sysStore = useSystemStore()
const playerStore = usePlayerStore()

const colorOps = keys(sysStore.staticResouces.minecraftColors).map(k => {
  return { label: k, code: sysStore.staticResouces.minecraftColors[k] }
})

/**
 * 入力グループ名のバリデーション
 */
function validateGroupName(name: string) {
  return name !== '' && !(name !== playerStore.selectedGroupName && keys(playerStore.searchGroups()).includes(name))
}
function validateMessage(name: string) {
  return name !== '' ? `${name}は既に存在します` : 'グループ名を入力してください'
}

/**
 * グループの新規作成時に使用する作成器 
 */
function generateGroup(group: PlayerGroup) {
  const sysStore = useSystemStore()
  sysStore.systemSettings().player.groups[group.name] = {
    name: group.name,
    color: group.color,
    players: toRaw(group.players)
  }
}

/**
 * グループの更新を行う
 */
function updateGroup() {
  // 一旦元のグループを削除する
  removeGroup()

  // 新しいグループを作成
  const newGroup = playerStore.selectedGroup
  newGroup.players = Array.from(playerStore.focusCards)
  generateGroup(newGroup)
}

/**
 * 選択されたグループを削除
 */
function removeGroup() {
  // 削除処理
  delete sysStore.systemSettings().player.groups[playerStore.selectedGroupName]

  // グループ編集カードを閉じる
  playerStore.openGroupEditor = false
}
</script>

<template>
  <q-card
    flat
    class="column card"
    :style="{'height': playerStore.selectedGroup.isNew ? '315px' : '385px'}"
  >
    <p class="q-py-sm q-pl-md q-ma-none text-body2">
      {{ playerStore.selectedGroup.isNew ? 'グループを作成' : `${playerStore.selectedGroupName}を編集` }}
    </p>

    <div class="absolute-top-right">
      <q-btn
        dense
        icon="close"
        class="q-pa-sm"
        @click="playerStore.openGroupEditor = false"
      />
    </div>
    
    <q-scroll-area style="flex: 1 1 0">
      <q-card-section class="q-pt-xs q-pb-none">
        <span class="text-caption">グループ名</span>
        <SsInput
          v-model="playerStore.selectedGroup.name"
          dense
          :rules="[val => validateGroupName(val) || validateMessage(val)]"
        />
      </q-card-section>
  
      <q-card-section class="column q-pb-xs">
        <span class="text-caption">カラー</span>
        <q-btn-dropdown
          dense
          icon="circle"
          menu-anchor="bottom left"
          menu-self="top left"
          :style="{'color': playerStore.selectedGroup.color, 'width': 'min-content'}"
        >
          <div class="q-gutter-sm row q-pa-xs" style="width: 136px; margin: 0 auto;">
            <template v-for="colorOp in colorOps" :key="colorOp">
              <q-btn
                v-close-popup
                dense
                flat
                icon="circle"
                class="q-ma-none"
                :style="{'color': colorOp.code}"
                @click="playerStore.selectedGroup.color = colorOp.code"
              >
                <q-tooltip class="text-body2">
                  {{ colorOp.label }}
                </q-tooltip>
              </q-btn>                
            </template>
          </div>
        </q-btn-dropdown>
      </q-card-section>
  
      <q-separator inset />
  
      <q-card-section
        class="q-pb-sm"
      >
        <q-btn
          outline
          :label="playerStore.selectedGroup.isNew ? `${playerStore.selectedGroup.name === '' ? '新グループ' : playerStore.selectedGroup.name }を作成` : `${playerStore.selectedGroupName}を更新`"
          :disable="(playerStore.focusCards.size === 0 || !validateGroupName(playerStore.selectedGroup.name))"
          color="primary"
          @click="updateGroup"
          class="full-width"
        />
      </q-card-section>
  
      <q-card-section
        v-show="playerStore.selectedGroup.name !== ''"
        class="q-pt-none q-pb-sm"
        style="font-size: .7rem;"
      >
        <span v-if="playerStore.focusCards.size === 0">
          プレイヤーを選択してください
        </span>
        <span v-else>
          {{
            playerStore.selectedGroup.isNew
            ? `選択中の${playerStore.focusCards.size}人をメンバーとする${playerStore.selectedGroup.name}を作成します`
            : `${playerStore.selectedGroupName}のメンバーを選択中の${playerStore.focusCards.size}人で更新します`
          }}
        </span>
      </q-card-section>
  
      <q-separator v-show="!playerStore.selectedGroup.isNew" inset />
  
      <q-card-section
        v-show="!playerStore.selectedGroup.isNew"
      >
        <q-btn
          outline
          :label="`${playerStore.selectedGroupName}を削除`"
          color="red"
          @click="removeGroup"
          class="full-width"
        />
      </q-card-section>
    </q-scroll-area>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  width: 13rem; 
  max-height: 50vh;
}
</style>