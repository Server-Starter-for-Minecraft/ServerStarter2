<script setup lang="ts">
import { ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePlayerStore } from 'src/stores/WorldTabsStore';

interface Prop {
  uuid: PlayerUUID
  opLevel?: 1 | 2 | 3 | 4
}
const prop = defineProps<Prop>()

const sysStore = useSystemStore()
const playerStore = usePlayerStore()
const playerData = sysStore.systemSettings().player.players.filter(p => p.uuid===prop.uuid)[0]
const focus = ref(false)

function onCardClicked() {
  // TODO: カードが選択されたら選択一覧にカードを追加し、カードをFocusモードにする
  // もう一度選択されたら選択一覧から除外し、フォーカスも解除する
  if (playerStore.focusCards.includes(prop.uuid)) {
    // playerStore.focusCards.(prop.uuid)
    focus.value = false
  }
  else {
    focus.value = true
  }
}
</script>

<template>
  <q-card flat bordered :class="`q-ma-xs card ${focus ? 'card-active' : ''}`">
    <q-item clickable @click="onCardClicked" class="q-pa-md">
      <q-item-section avatar>
        <q-avatar square>
          <q-img :src="playerData.avatar" class="avaterImg"/>
          <q-img :src="playerData.avatar_overlay" class="avaterImg" style="width: 110%;"/>
        </q-avatar>
      </q-item-section>

      <q-item-section>
        <q-item-label>{{ playerData.name }}</q-item-label>
        <q-item-label caption>
          test
        </q-item-label>
      </q-item-section>
    </q-item>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  width: max-content;
}
.card-active {
  border-color: $primary;
}

.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}
</style>