<script setup lang="ts">
import { ref } from 'vue'
import { useDialogPluginComponent } from 'quasar'
import { iEditorDialogProps, iEditorDialogReturns } from './editorDialog'
import SsInput from 'src/components/util/base/ssInput.vue'
import ItemPlayer from './ItemPlayer.vue'

const prop = defineProps<iEditorDialogProps>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent()

const inputName = ref(prop.groupName ?? '')
const inputColorCode = ref(prop.groupColor ?? '')
const editMembers = ref(Array.from(prop.members))

function onOKClicked() {
  onDialogOK({
    name: inputName.value,
    color: inputColorCode.value,
    members: editMembers.value
  } as iEditorDialogReturns)
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card>
      <q-card-section>
        <div class="text-h6">{{ groupName !== void 0 ? 'グループの編集' : '新規グループの作成' }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <!-- TODO: 既に存在するグループ名を指定できないようにする -->
        <ss-input
          v-model="inputName"
          label="新規グループ名を入力"
          @clear="inputName = ''"
        />

        <div class="row items-center q-mt-md">
          <q-select 
            v-model="inputColorCode"
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

          <q-avatar icon="square" class="q-pt-xs" :style="{ 'color': inputColorCode }" />
        </div>

        <!-- TODO: グループメンバーを追加できるようにする（プレイヤー探索機能を実装した後） -->
        <div class="q-pt-lg" style="height: 200px;">
          <p class="q-ma-none">グループメンバー</p>
          <!-- ここに検索欄を実装？ -->
          <q-scroll-area class="fit q-my-sm">
            <q-list separator>
              <template v-for="uuid in editMembers" :key="uuid">
                <item-player v-model="editMembers" :uuid="uuid" />
              </template>
            </q-list>
          </q-scroll-area>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn
          :disable="inputName === '' || inputColorCode === ''"
          label="登録"
          color="primary"
          v-close-popup
          @click="onOKClicked"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>