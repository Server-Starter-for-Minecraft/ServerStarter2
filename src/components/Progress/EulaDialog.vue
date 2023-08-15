<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { EulaDialogProp } from './iEulaDialog';
import BaseDialogCard from '../util/baseDialog/baseDialogCard.vue';
import SsA from '../util/base/ssA.vue';
import SsBtn from '../util/base/ssBtn.vue';

defineProps<EulaDialogProp>()
defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" persistent>
    <BaseDialogCard
      title="Minecraft EULA に同意"
      okBtnTxt="EULA に同意して実行"
      @okClick="onDialogOK"
    >
      <template #default>        
        <p class="q-my-none" style="font-size: .8rem; opacity: .8;">
          このサーバーは<SsA :url="eulaURL">Minecraft EULA</SsA>の規約が適用されます。<br>
          ご利用前にご一読ください。
        </p>
      </template>
      <template #additionalBtns>
        <SsBtn
          label="EULA に同意しない"
          color="red"
          @click="onDialogCancel"
        />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>