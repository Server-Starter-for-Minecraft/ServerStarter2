<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import {
  DonationService,
  donationServices,
  getDonationPageUrl,
} from './donationServices';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

/** 寄付ダイアログに表示する（受付中の）寄付サービス */
const visibleServices = donationServices.filter((s) => s.visible);

/**
 * 選択された寄付サービスの寄付ページ（公式ホームページ経由でサービスのページへ移動する）をブラウザで開き，ダイアログを閉じる
 *
 * @param service 選択された寄付サービス
 */
function openDonationPage(service: DonationService) {
  window.API.sendOpenBrowser(getDonationPageUrl(service));
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

      <div class="column q-gutter-y-sm">
        <q-card
          v-for="service in visibleServices"
          :key="service.id"
          flat
          bordered
          class="service-card"
        >
          <q-item clickable class="q-pa-md" @click="openDonationPage(service)">
            <q-item-section avatar>
              <q-icon :name="service.icon" color="primary" size="2.2rem" />
            </q-item-section>
            <q-item-section>
              <q-item-label class="service-title">
                {{ $t(`mainLayout.donation.services.${service.id}.title`) }}
              </q-item-label>
              <q-item-label caption>
                {{ $t(`mainLayout.donation.services.${service.id}.desc`) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-icon name="open_in_new" />
            </q-item-section>
          </q-item>
        </q-card>
      </div>

      <div class="row items-center no-wrap q-mt-md note">
        <q-icon name="open_in_browser" size="1rem" class="q-mr-xs" />
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

.service-card {
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

.service-title {
  font-size: 1.1rem;
  font-weight: bold;
}

.note {
  font-size: 0.7rem;
  opacity: 0.6;
}
</style>
