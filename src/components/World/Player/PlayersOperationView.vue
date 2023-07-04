<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { OpSetting, PlayerSetting } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import { generateGroup, iEditorDialogProps, iEditorDialogReturns } from './Editor/editorDialog';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import GroupEditorView from './Editor/GroupEditorView.vue';

interface Prop {
  modelValue: PlayerSetting[]
  disable: boolean
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const playerModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const $q = useQuasar()
const playerStore = usePlayerStore()

function openEditor() {
  $q.dialog({
    component: GroupEditorView,
    componentProps: {
      members: Array.from(playerStore.focusCards)
    } as iEditorDialogProps
  }).onOk((payload: iEditorDialogReturns) => {
    // グループの登録
    generateGroup(payload.name, payload.color, payload.members)
  })
}

function removePlayer() {
  // フォーカスされているプレイヤーを削除
  playerStore.focusCards.forEach(selectedPlayerUUID => {
    playerModel.value.splice(
      playerModel.value.map(p => p.uuid).indexOf(selectedPlayerUUID), 1
    )
  });
  // フォーカスのリセット
  playerStore.unFocus()
}

function setOP() {
  function setter(setVal?: OpSetting) {
    playerModel.value.filter(
      p => playerStore.focusCards.has(p.uuid)
    ).forEach(p => {
      p.op = setVal
    });
  }

  if (playerStore.selectedOP === 0 || playerStore.selectedOP === void 0) {
    setter()
  }
  else {
    setter({ level: playerStore.selectedOP, bypassesPlayerLimit: false })
  }
}
</script>

<template>
  <div class="row full-width q-pb-md">
    <SsSelect
      v-model="playerStore.selectedOP"
      @update:model-value="setOP"
      :disable="disable"
      label="OPレベルの変更"
      :options="[...Array(5)].map((_, i) => {
        return { label: $t(`player.opDesc.${i}`), value: i }
      })"
      option-label="label"
      option-value="value"
      dense
      class="col"
    />

    <q-btn
      :disable="disable"
      dense
      size=".8rem"
      color="primary"
      label="グループを作成"
      class="q-mx-md q-pa-sm"
      @click="openEditor"
    />

    <q-btn
      :disable="disable"
      dense
      size=".8rem"
      color="red"
      label="プレイヤーを削除"
      icon-right="delete"
      class="q-pa-sm"
      @click="removePlayer"
    />
  </div>
</template>