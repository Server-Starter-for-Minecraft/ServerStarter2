<script setup lang="ts">
import SsA from '../util/base/ssA.vue';
import SsBtn from '../util/base/ssBtn.vue';
import SsI18nT from '../util/base/ssI18nT.vue';
import BaseDialogCard from '../util/baseDialog/baseDialogCard.vue';
import { EulaDialogProp } from './iEulaDialog';

/**
 * Minecraft EULAへの同意を求めるカード
 *
 * ワールドの編集画面上に`WorldRequestView`から表示する
 */
defineProps<EulaDialogProp>();
/** answer: EULAに同意したか */
defineEmits<{ answer: [agreed: boolean] }>();
</script>

<template>
  <BaseDialogCard
    :title="$t('eulaDialog.title')"
    :okBtnTxt="$t('eulaDialog.agree')"
    @okClick="$emit('answer', true)"
  >
    <template #default>
      <p
        class="q-my-none"
        style="font-size: 0.8rem; opacity: 0.8; white-space: pre-line"
      >
        <SsI18nT keypath="eulaDialog.desc" tag="label">
          <SsA :url="eulaURL">{{ $t('eulaDialog.eula') }}</SsA>
        </SsI18nT>
      </p>
    </template>
    <template #additionalBtns>
      <SsBtn
        :label="$t('eulaDialog.disagree')"
        color="negative"
        @click="$emit('answer', false)"
      />
    </template>
  </BaseDialogCard>
</template>
