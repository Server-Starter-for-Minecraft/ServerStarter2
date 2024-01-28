<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { PlayerUUID } from 'app/src-electron/schema/brands';
import { useSystemStore } from 'src/stores/SystemStore';
import { OwnerDialogProp } from './iOwnerDialog';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import SearchResultView from './SearchResultView.vue';
import InputFieldView from './InputFieldView.vue';
import PlayerCard from '../PlayerCard.vue';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();
defineProps<OwnerDialogProp>();

const sysStore = useSystemStore();
const ownerCandidate: Ref<PlayerUUID | undefined> = ref(
  sysStore.systemSettings.user.owner
);

function registOwner() {
  if (ownerCandidate.value) {
    sysStore.systemSettings.user.owner = ownerCandidate.value;
  }
  onDialogOK();
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="persistent">
    <BaseDialogCard
      :title="$t('owner.set')"
      :okBtnTxt="$t('owner.registBtn')"
      :disable="ownerCandidate === void 0"
      @okClick="registOwner"
      @close="onDialogOK"
    >
      <template #default>
        <p
          class="q-my-sm text-body2"
          style="opacity: 0.5"
          v-html="$t('owner.dialogDesc')"
        ></p>

        <InputFieldView class="q-my-md" />
        <SearchResultView v-model="ownerCandidate" />

        <div v-if="ownerCandidate" class="q-my-sm">
          <span class="text-caption">{{ $t('owner.ownerPlayer') }}</span>
          <PlayerCard v-model="ownerCandidate" />
        </div>
      </template>

      <template v-if="persistent" #additionalBtns>
        <SsBtn :label="$t('general.skip')" @click="onDialogOK" />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>
