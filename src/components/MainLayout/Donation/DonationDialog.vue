<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import { DonationOption, donationOptions, formatYen } from './donationOptions';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

/**
 * 選択された金額の寄付ページをブラウザで開き，ダイアログを閉じる
 *
 * @param option 選択された寄付の選択肢
 */
function openDonationPage(option: DonationOption) {
  window.API.sendOpenBrowser(option.url);
  onDialogOK();
}
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      :title="$t('mainLayout.donation.title')"
      style="width: 34rem; max-width: 100%"
      @close="onDialogCancel"
    >
      <div class="row items-center no-wrap q-mb-md">
        <q-avatar
          size="4rem"
          class="hero-icon q-mr-md"
          icon="volunteer_activism"
          text-color="primary"
        />
        <div class="desc">{{ $t('mainLayout.donation.desc') }}</div>
      </div>

      <div class="text-subtitle2 q-mb-sm">
        {{ $t('mainLayout.donation.select') }}
      </div>
      <div class="option-grid">
        <q-card
          v-for="option in donationOptions"
          :key="option.id"
          flat
          bordered
          class="option-card"
        >
          <q-item
            clickable
            class="column items-center justify-center q-pa-md fit"
            @click="openDonationPage(option)"
          >
            <q-icon :name="option.icon" color="primary" size="2.2rem" />
            <div v-if="option.amount !== void 0" class="amount q-mt-xs">
              {{ formatYen(option.amount) }}
            </div>
            <div v-else class="amount amount--text q-mt-xs">
              {{ $t(`mainLayout.donation.options.${option.id}.title`) }}
            </div>
            <div class="caption text-center">
              {{ $t(`mainLayout.donation.options.${option.id}.desc`) }}
            </div>
          </q-item>
        </q-card>
      </div>

      <div class="row items-center no-wrap q-mt-md note">
        <q-icon name="lock" size="1rem" class="q-mr-xs" />
        <span>{{ $t('mainLayout.donation.note') }}</span>
      </div>
    </BaseDialogCard>
  </q-dialog>
</template>

<style scoped lang="scss">
.hero-icon {
  // テーマ色（primary）を薄く敷いた円形の背景
  background-color: color-mix(in srgb, var(--q-primary) 15%, transparent);
}

.desc {
  font-size: 0.85rem;
  white-space: pre-line;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.option-card {
  border-radius: 12px;
  overflow: hidden;
  transition:
    border-color 0.15s,
    transform 0.15s;

  // 選択できることが伝わるように，ホバー時・キーボードでのフォーカス時にテーマ色で強調する
  &:hover,
  &:focus-within {
    border-color: var(--q-primary);
    transform: translateY(-2px);
  }
}

.amount {
  font-size: 1.4rem;
  line-height: 2.2rem;
  font-weight: bold;

  // 金額以外の文言（「金額を指定」など）は金額と見た目の大きさを揃えるため小さめにする
  &--text {
    font-size: 1.15rem;
  }
}

.caption {
  font-size: 0.75rem;
  opacity: 0.7;
}

.note {
  font-size: 0.7rem;
  opacity: 0.6;
}
</style>
