<script setup lang="ts">
import { Ref, ref } from 'vue';
import { QStepper, useDialogPluginComponent } from 'quasar';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { NgrokDialogProp, NgrokDialogReturns } from './steps/iNgrok';
import Step1View from './steps/Step1View.vue';
import Step2View from './steps/Step2View.vue';
import Step3View from './steps/Step3View.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<NgrokDialogProp>();

const step3Model: Ref<NgrokDialogReturns> = ref({
  token: prop.token,
  isAllUesNgrok: false,
});
const isRegisteredNgrok = prop.token !== '';
const step = ref(isRegisteredNgrok ? 3 : 1);
const stepper: Ref<QStepper | undefined> = ref();
const isSkipRegister = ref(false);

// 一番最初の設定の際のみは初期値をTrueにする
if (!isRegisteredNgrok) {
  step3Model.value.isAllUesNgrok = true;
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('home.ngrok.title')"
      @close="onDialogCancel"
      style="width: 40rem; max-width: 100%"
    >
      <template #default>
        <q-stepper v-model="step" ref="stepper" color="primary" animated flat>
          <q-step
            :name="1"
            :title="$t('home.ngrok.dialog.firstPage.title')"
            prefix="1"
            :disable="isRegisteredNgrok"
            :done="step > 1"
          >
            <Step1View
              v-model="isSkipRegister"
              :next="(stepName: number) => step = stepName"
            />
          </q-step>

          <q-step
            :name="2"
            :title="$t('home.ngrok.dialog.secondPage.title')"
            prefix="2"
            :disable="isSkipRegister || isRegisteredNgrok"
            :done="!isSkipRegister && step > 2"
          >
            <Step2View />
          </q-step>

          <q-step
            :name="3"
            :title="$t('home.ngrok.dialog.thirdPage.title')"
            prefix="3"
          >
            <Step3View v-model="step3Model" />
          </q-step>
        </q-stepper>
      </template>

      <template #additionalBtns>
        <SsBtn
          v-show="step !== 1 && !isRegisteredNgrok"
          flat
          free-width
          @click="stepper?.previous()"
          :label="$t('general.back')"
          class="q-mr-sm"
        />
        <SsBtn
          v-show="step !== 1"
          outline
          :label="
            step === 3
              ? $t('home.ngrok.dialog.save')
              : $t('home.ngrok.dialog.goNext')
          "
          color="primary"
          :disable="step === 3 && step3Model.token === ''"
          @click="step === 3 ? onDialogOK(step3Model) : stepper?.next()"
        />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>
