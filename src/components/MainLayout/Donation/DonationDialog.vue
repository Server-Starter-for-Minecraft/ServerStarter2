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

/** 上部の帯に表示するアプリのロゴ（帯の明暗に合わせて文字色の異なるロゴを使い分ける） */
const logo = computed(() =>
  $q.dark.isActive
    ? assets.svg.ServerStarterLogo_White_2()
    : assets.svg.ServerStarterLogo_Black_2()
);

/** 上部の帯の背景画像（公式ホームページのトップと同じ画像）を CSS 変数として渡す */
const bannerStyle = {
  '--banner-image': `url("${assets.png.donation_banner}")`,
};

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
      上部にロゴの帯を置くレイアウトのため，見出しと本文だけを縦に積む BaseDialogCard は使わず，
      閉じるボタンの配置など BaseDialogCard の作法に合わせて組み立てる
    -->
    <q-card flat class="donation-card">
      <!-- 公式ホームページのトップと同じく，画像の帯の下に primary 色の線を引く -->
      <div class="banner row items-center" :style="bannerStyle">
        <q-icon :name="logo" class="banner-logo" />

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
      </div>

      <div class="content column no-wrap">
        <div class="title">{{ $t('mainLayout.donation.title') }}</div>
        <div class="desc">{{ $t('mainLayout.donation.desc') }}</div>

        <div class="services">
          <div class="services-label">
            {{ $t('mainLayout.donation.servicesLabel') }}
          </div>
          <!-- システム設定と同じく，項目の右に操作ボタンを置いた行を区切り線で並べる -->
          <template v-for="service in visibleServices" :key="service.id">
            <q-separator />
            <!-- 左にサービスのアイコンを大きく置き，その右にサービス名と説明文を縦に積む -->
            <div class="row items-center no-wrap service">
              <!-- アイコンの有無や縦横比が違っても文字の開始位置がそろうよう，一定の大きさの枠に収める -->
              <div class="row flex-center service-icon">
                <img v-if="service.icon" :src="service.icon" alt="" />
              </div>
              <div class="col column service-info">
                <span class="service-name" :style="{ color: service.color }">
                  {{ service.name }}
                </span>
                <span class="service-desc">
                  {{ $t(`mainLayout.donation.services.${service.id}.desc`) }}
                </span>
              </div>
              <SsBtn
                free-width
                color="primary"
                class="service-btn"
                :label="$t('mainLayout.donation.openBtn')"
                :aria-label="
                  $t('mainLayout.donation.openBtnAria', { name: service.name })
                "
                @click="openDonationPage(service)"
              >
                <q-icon name="open_in_new" size="1rem" class="q-ml-sm" />
              </SsBtn>
            </div>
          </template>
          <q-separator />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.donation-card {
  width: 36rem;
  max-width: 100%;
}

.banner {
  position: relative;
  height: 7rem;
  padding: 0 1.75rem;
  border-bottom: 3px solid var(--q-primary);
  // 画像の上に半透明の面を重ね，ロゴの文字が読めるようにする（面の色は下のテーマ別の指定で決める）
  background:
    linear-gradient(var(--banner-overlay), var(--banner-overlay)),
    var(--banner-image) center / cover;
}

.body--light .banner {
  --banner-overlay: rgba(250, 250, 250, 0.78);
}

.body--dark .banner {
  --banner-overlay: rgba(29, 29, 29, 0.72);
}

// ロゴの SVG は横長のため，q-icon の正方形の大きさを上書きして高さと縦横比で大きさを決める
// （縦横比は ServerStarterLogo_*_2.svg の viewBox の値。ロゴを差し替えたら合わせて更新する）
.banner-logo {
  height: 4rem;
  width: auto;
  aspect-ratio: 1782 / 431;
}

.content {
  gap: 0.625rem;
  padding: 1.375rem 1.75rem 1.5rem;
}

.title {
  font-size: 1.2rem;
  font-weight: bold;
}

.desc {
  font-size: 0.875rem;
  line-height: 1.8;
  white-space: pre-line;
  opacity: 0.8;
}

.services {
  padding-top: 0.75rem;
}

.services-label {
  font-size: 0.75rem;
  opacity: 0.6;
  padding-bottom: 0.375rem;
}

.service {
  gap: 1rem;
  padding: 0.875rem 0;
}

.service-icon {
  width: 1.875rem;
  height: 1.875rem;
  flex-shrink: 0;

  img {
    // 配布元のアイコンを加工しないよう，枠に収まる大きさで縦横比を保って表示する
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

.service-info {
  min-width: 0;
  gap: 0.2rem;
}

.service-name {
  font-size: 0.95rem;
  font-weight: bold;
}

.service-desc {
  font-size: 0.75rem;
  opacity: 0.6;
}

.service-btn {
  flex-shrink: 0;
  min-width: 8.5rem;
}
</style>
