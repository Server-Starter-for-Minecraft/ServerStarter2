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
const playerData = sysStore.systemSettings().player.players[prop.uuid]
const focus = ref(false)

function onCardClicked() {
  if (playerStore.focusCards.includes(prop.uuid)) {
    playerStore.focusCards.splice(playerStore.focusCards.indexOf(prop.uuid), 1)
    focus.value = false
  }
  else {
    playerStore.focusCards.push(prop.uuid)
    focus.value = true
  }
}
</script>

<template>
  <q-card flat bordered :class="`fit card ${focus ? 'card-active' : ''}`">
    <q-item class="q-pa-md" style="height: 5.5rem;">
      <q-item-section avatar top>
        <q-avatar square>
          <q-img :src="playerData.avatar" class="avaterImg"/>
          <q-img :src="playerData.avatar_overlay" class="avaterImg" style="width: 110%;"/>
        </q-avatar>
      </q-item-section>

      <q-item-section top>
        <q-item-label class="name">{{ playerData.name }}</q-item-label>
        <q-item-label v-show="opLevel !== void 0" caption class="q-pt-xs" style="opacity: 0.7;">
          権限レベル {{ opLevel }}
        </q-item-label>
      </q-item-section>
      <q-item-section side top>
        <q-icon :name="opLevel !== void 0 ? 'star' : ''"/>
      </q-item-section>
    </q-item>

    <q-card-section class="q-py-none">
      <span class="text-caption">所属グループ</span>
      <p>test</p>
    </q-card-section>

    <div class="absolute-top fit">
      <q-btn flat color="transparent" @click="onCardClicked" class="fit"/>
    </div>
  </q-card>
</template>

<style scoped lang="scss">
.card {
  min-width: 14rem;
  max-width: 14rem;
}
.card-active {
  border-color: $primary;
}

.avaterImg {
  position: absolute;
  image-rendering: pixelated;
}

.name {
  font-size: 1.5rem;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
</style>