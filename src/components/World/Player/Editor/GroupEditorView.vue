<script setup lang="ts">
import { computed, ref, toRaw } from 'vue'
import { useSystemStore } from 'src/stores/SystemStore'
import { usePlayerStore } from 'src/stores/WorldTabsStore'
import SsInput from 'src/components/util/base/ssInput.vue'
import ItemPlayer from './ItemPlayer.vue'

interface Prop {
  modelValue: any
  groupName?: string
}

const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const model = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})

const sysStore = useSystemStore()
const playerStore = usePlayerStore()
const inputGroupName = ref(prop.groupName ?? '')
const groupColorCode = ref(
  prop.groupName === void 0 ? '' : sysStore.systemSettings().player.groups[prop.groupName].color
)
const groupMembers = prop.groupName === void 0 ? playerStore.focusCards : sysStore.systemSettings().player.groups[prop.groupName].players

function onRegisterClicked() {
  // グループの更新時は一度、元のグループを削除してグループを再登録する
  if (prop.groupName !== void 0) {
    delete sysStore.systemSettings().player.groups[inputGroupName.value]
  }

  // グループの登録
  generateGroup()
}

function generateGroup() {
  sysStore.systemSettings().player.groups[inputGroupName.value] = {
    name: inputGroupName.value,
    color: groupColorCode.value,
    players: toRaw(groupMembers)
  }
}
</script>

<template>
  <q-dialog v-model="model">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ groupName !== void 0 ? 'グループの編集' : '新規グループの作成' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- TODO: 既に存在するグループ名を指定できないようにする -->
        <ss-input
          v-model="inputGroupName"
          label="新規グループ名を入力"
          @clear="inputGroupName = ''"
        />

        <div class="row items-center q-mt-md">
          <q-select 
            v-model="groupColorCode"
            label="グループの色を選択"
            :options="[{ label: 'red', code: '#ff0000' }, { label: 'black', code: '#000000' }]" emit-value map-options
            option-label="label"
            option-value="code"
            class="col"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                  <q-icon name="square" :style="{ 'color': scope.opt.code }" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <q-avatar icon="square" class="q-pt-xs" :style="{ 'color': groupColorCode }" />
        </div>

        <!-- TODO: グループメンバーを追加できるようにする（プレイヤー探索機能を実装した後） -->
        <div class="q-pt-lg">
          <p class="q-ma-none">グループメンバー</p>
          <!-- ここに検索欄を実装？ -->
          <q-virtual-scroll
            style="max-height: 200px;"
            :items="groupMembers"
            separator
            v-slot="{ item, index }"
          >
            <item-player v-model="groupMembers" :key="index" :uuid="item" />
          </q-virtual-scroll>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :disable="inputGroupName === '' || groupColorCode === ''"
          label="登録"
          color="primary"
          v-close-popup
          @click="onRegisterClicked"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>