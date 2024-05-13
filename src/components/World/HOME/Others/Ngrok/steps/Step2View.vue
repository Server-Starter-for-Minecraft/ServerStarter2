<script setup lang="ts">
import { ref } from 'vue';
import { assets } from 'src/assets/assets';
import SsA from 'src/components/util/base/ssA.vue';
import BaseCard from './slides/BaseCard.vue';

const slide = ref(1);
</script>

<template>
  <div>
    <p class="text-caption">
      {{ $t('home.ngrok.dialog.secondPage.dialogTitle') }}
    </p>

    <q-carousel
      v-model="slide"
      animated
      transition-prev="slide-right"
      transition-next="slide-left"
      control-color="primary"
      navigation
      padding
      arrows
      class="shadow-1 rounded-borders"
    >
      <q-carousel-slide :name="1">
        <BaseCard
          :title="$t('home.ngrok.dialog.secondPage.title')"
          :img="assets.png.signUp"
          :img-width="9"
        >
          <p>
            <i18n-t
              keypath="home.ngrok.dialog.secondPage.signup.desc"
              tag="label"
              for="home.ngrok.dialog.secondPage.signup.link"
            />
            <SsA url="https://dashboard.ngrok.com/signup">
              {{ $t('home.ngrok.dialog.secondPage.signup.link') }}
            </SsA>
          </p>
          <p>{{ $t('home.ngrok.dialog.secondPage.signup.register') }}</p>
        </BaseCard>
      </q-carousel-slide>
      <q-carousel-slide :name="2">
        <BaseCard
          :title="$t('home.ngrok.dialog.secondPage.auth.title')"
          :img="assets.png.verifyEmail"
          :img-width="16"
        >
          <p>{{ $t('home.ngrok.dialog.secondPage.auth.desc') }}</p>
        </BaseCard>
      </q-carousel-slide>
      <q-carousel-slide :name="3">
        <BaseCard
          :title="$t('home.ngrok.dialog.secondPage.question.title')"
          :img="assets.png.welcome"
          :img-width="10"
        >
          <p>{{ $t('home.ngrok.dialog.secondPage.question.desc') }}</p>
        </BaseCard>
      </q-carousel-slide>
      <q-carousel-slide :name="4">
        <BaseCard
          :title="$t('home.ngrok.dialog.secondPage.howToConnect.title')"
          :img="assets.png.mcInput"
          :img-width="10"
        >
          <p style="white-space: pre-line">
            <i18n-t keypath="home.ngrok.dialog.secondPage.howToConnect.desc">
              <b><u>
                {{ $t('home.ngrok.dialog.secondPage.howToConnect.changeNum') }}
              </u></b>
            </i18n-t>
          </p>
          <p>{{ $t('home.ngrok.dialog.secondPage.howToConnect.connect') }}</p>
        </BaseCard>
      </q-carousel-slide>
    </q-carousel>
  </div>
</template>

<style scoped lang="scss">
p {
  line-height: 1.5rem;
}
</style>
