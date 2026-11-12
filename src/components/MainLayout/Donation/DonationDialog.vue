<script setup lang="ts">
import { computed } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { assets } from 'src/assets/assets';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import {
  DonationService,
  donationServices,
  getDonationPageUrl,
} from './donationServices';

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();
const $q = useQuasar();

/** 寄付ダイアログに表示する（受付中の）寄付サービス */
const visibleServices = donationServices.filter((s) => s.visible);

/** 左側の面に表示するアプリのロゴ（背景の明暗に合わせて文字色の異なるロゴを使い分ける） */
const logo = computed(() =>
  $q.dark.isActive
    ? assets.svg.ServerStarterLogo_White_4()
    : assets.svg.ServerStarterLogo_Black_4()
);

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
    <!--
      左にロゴの面を置く横長のレイアウトのため，見出しと本文を縦に積む BaseDialogCard は使わず，
      閉じるボタンの配置など BaseDialogCard の作法に合わせて組み立てる
    -->
    <q-card flat class="donation-card row no-wrap">
      <div class="logo-panel column flex-center">
        <q-icon :name="logo" size="9rem" />
      </div>

      <div class="content col column no-wrap">
        <div class="title">{{ $t('mainLayout.donation.title') }}</div>
        <div class="desc">{{ $t('mainLayout.donation.desc') }}</div>

        <template v-for="service in visibleServices" :key="service.id">
          <q-separator />
          <!-- 「アイコン＋サービス名」と「説明文」の 2 つのまとまりとして並べる -->
          <div class="row items-center no-wrap service">
            <div
              class="row items-center no-wrap service-name"
              :style="{ color: service.color }"
            >
              <img v-if="service.icon" :src="service.icon" alt="" />
              <span>{{ service.name }}</span>
            </div>
            <span class="service-desc">
              {{ $t(`mainLayout.donation.services.${service.id}.desc`) }}
            </span>
          </div>
          <div class="row justify-end">
            <!-- サービス名の長さで文言が変わるため，既定幅（13rem）を最小幅として文言に合わせて広げる -->
            <SsBtn
              free-width
              color="primary"
              style="min-width: 13rem"
              :label="$t('mainLayout.donation.openBtn', { name: service.name })"
              @click="openDonationPage(service)"
            >
              <q-icon name="open_in_new" size="1rem" class="q-ml-sm" />
            </SsBtn>
          </div>
        </template>
      </div>

      <div class="absolute-top-right">
        <q-btn
          dense
          flat
          round
          icon="close"
          size="1rem"
          class="q-ma-sm"
          :aria-label="$t('general.close')"
          @click="onDialogCancel"
        />
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.donation-card {
  width: 42.5rem;
  max-width: 100%;
}

.logo-panel {
  width: 13.75rem;
  flex-shrink: 0;
  padding: 2rem 1.25rem;
}

// ロゴの面は本文と区別するため，ページの背景に近い色を敷いて区切り線を引く
.body--light .logo-panel {
  background-color: #f2f2f2;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.body--dark .logo-panel {
  background-color: #262626;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.content {
  min-width: 0;
  gap: 0.875rem;
  padding: 1.75rem 1.75rem 1.25rem;
}

.title {
  font-size: 1.2rem;
  font-weight: bold;
  // 右上の閉じるボタンと重ならないように余白を取る
  padding-right: 2.5rem;
}

.desc {
  font-size: 0.875rem;
  line-height: 1.8;
  white-space: pre-line;
  opacity: 0.8;
}

.service {
  gap: 1rem;
}

.service-name {
  flex-shrink: 0;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: bold;

  img {
    // 配布元のアイコンを加工しないよう，高さだけを指定して縦横比を保つ
    height: 1.1rem;
    width: auto;
  }
}

.service-desc {
  font-size: 0.8rem;
  opacity: 0.6;
}
</style>
