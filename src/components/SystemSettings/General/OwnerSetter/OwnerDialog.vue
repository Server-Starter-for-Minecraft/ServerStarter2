<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { Player } from 'app/src-electron/schema/player';
import { usePlayerStore } from 'src/stores/WorldTabs/PlayerStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import SearchResultView from 'src/components/World/Player/SearchResultView.vue';
import PlayerCard from '../PlayerCard.vue';
import InputFieldView from './InputFieldView.vue';
import { OwnerDialogProp, ReturnOwnerDialog } from './iOwnerDialog';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const prop = defineProps<OwnerDialogProp>();

const playerStore = usePlayerStore();
const ownerCandidate: Ref<Player | undefined> = ref(prop.ownerPlayer);

function ownerRegister(player: Player) {
  ownerCandidate.value = player;
  // 検索欄をリセット
  playerStore.searchName = '';
}

function registOwner() {
  onDialogOK({
    ownerPlayer: ownerCandidate.value,
  } as ReturnOwnerDialog);
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" :persistent="persistent">
    <BaseDialogCard
      :title="$t('owner.set')"
      :okBtnTxt="$t('owner.registBtn')"
      :disable="ownerCandidate === void 0"
      :onClose="persistent ? undefined : onDialogCancel"
      @okClick="registOwner"
    >
      <template #default>
        <p
          class="q-my-sm text-body2"
          style="opacity: 0.5; white-space: pre-line"
        >
          {{ $t('owner.dialogDesc') }}
        </p>

        <InputFieldView class="q-my-md" />

        <div v-show="playerStore.searchName !== ''" class="q-pb-md">
          <span class="text-caption">{{ $t('owner.searchResult') }}</span>
          <SearchResultView
            :register-btn-text="$t('owner.registerPlayer')"
            :register-process="ownerRegister"
          />
        </div>

        <div v-if="ownerCandidate" class="q-my-sm">
          <span class="text-caption">{{ $t('owner.ownerPlayer') }}</span>
          <PlayerCard v-model="ownerCandidate" />
        </div>
      </template>

      <template v-if="persistent" #additionalBtns>
        <SsBtn :label="$t('general.skip')" @click="onDialogCancel" />
      </template>
    </BaseDialogCard>
  </q-dialog>
</template>
