<script setup lang="ts">
import { Ref, ref } from 'vue';
import { QStepper, useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import Step1View from './steps/Step1View.vue'
import Step2View from './steps/Step2View.vue';
import Step3View from './steps/Step3View.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const step = ref(1)
const stepper: Ref<QStepper | undefined> = ref()
const isSkipRegister = ref(false)
// TODO: 初期値はSystemSettingsの値を入れる
const authToken = ref('')
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      title="ポート開放不要化"
      @close="onDialogCancel"
      style="width: 40rem; max-width: 100%;"
    >
      <template #default>
        <q-stepper
          v-model="step"
          ref="stepper"
          color="primary"
          animated
          flat
        >
          <q-step
            :name="1"
            title="アカウント登録"
            prefix="1"
            :done="step > 1"
          >
            <Step1View
              v-model="isSkipRegister"
              :next="(stepName: number) => step = stepName"
            />
          </q-step>
          
          <q-step
            :name="2"
            title="アカウント登録"
            prefix="2"
            :disable="isSkipRegister"
            :done="!isSkipRegister && step > 2"
          >
            <Step2View />
          </q-step>
  
          <q-step
            :name="3"
            title="トークンを登録"
            prefix="3"
          >
            <Step3View v-model="authToken" />
          </q-step>  
        </q-stepper>
      </template>

      <template #additionalBtns>
        <SsBtn
          v-show="step !== 1"
          flat
          free-width
          @click="stepper?.previous()"
          label="戻る"
          class="q-mr-sm"
        />
        <SsBtn
          v-show="step !== 1"
          outline
          :label="step === 3 ? '登録内容を保存' : '次の設定へ進む'"
          color="primary"
          :disable="step === 3 && authToken === ''"
          @click="step === 3 ? onDialogOK() : stepper?.next()"
        />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>