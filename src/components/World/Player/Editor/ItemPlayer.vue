<script setup lang="ts">
import { computed, ref } from 'vue';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import PlayerHeadView from '../utils/PlayerHeadView.vue';

interface Prop {
  modelValue: PlayerUUID[]
  index?: number
  uuid: PlayerUUID
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const membersModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const sysStore = useSystemStore()
const showDeleteBtn = ref(false)

function removePlayer() {
  membersModel.value.splice(membersModel.value.indexOf(prop.uuid), 1)
}
</script>

<template>
  <q-item
    :key="index"
    @mouseover="showDeleteBtn = true"
    @mouseout="showDeleteBtn = false"
  >
    <q-item-section avatar>
      <PlayerHeadView :uuid="uuid" size="1.5rem"/>
    </q-item-section>

    <q-item-section>{{ sysStore.systemSettings().player.players[uuid].name }}</q-item-section>
    
    <q-item-section side>
      <q-btn
        v-show="showDeleteBtn && membersModel.length > 1"
        flat
        dense
        size=".7rem"
        icon="do_not_disturb_on"
        color="red"
        @click="removePlayer"
      />
    </q-item-section>
  </q-item>
</template>