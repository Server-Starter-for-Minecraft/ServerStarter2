<script setup lang="ts">
import { useQuasar } from 'quasar';
import { OpSetting } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabsStore';
import { useMainStore } from 'src/stores/MainStore';
import { generateGroup, iEditorDialogProps, iEditorDialogReturns } from './Editor/editorDialog';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import GroupEditorView from './Editor/GroupEditorView.vue';

interface Prop {
  disable: boolean
}
defineProps<Prop>()

const $q = useQuasar()
const mainStore = useMainStore()
const playerStore = usePlayerStore()

function openEditor() {
  $q.dialog({
    component: GroupEditorView,
    componentProps: {
      members: playerStore.focusCards
    } as iEditorDialogProps
  }).onOk((payload: iEditorDialogReturns) => {
    // グループの登録
    generateGroup(payload.name, payload.color, payload.members)
  })
}

function removePlayer() {
  // フォーカスされているプレイヤーを削除
  playerStore.focusCards.forEach(selectedPlayerUUID => {
    mainStore.world().players.splice(
      mainStore.world().players.map(p => p.uuid).indexOf(selectedPlayerUUID), 1
    )
  });
  // フォーカスのリセット
  playerStore.unFocus()
}

function setOP() {
  function setter(setVal?: OpSetting) {
    mainStore.world().players.filter(
      p => playerStore.focusCards.includes(p.uuid)
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