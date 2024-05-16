<script setup lang="ts">
import { NgrokDialogReturns } from './iNgrok';
import SsA from 'src/components/util/base/ssA.vue';
import SsInput from 'src/components/util/base/ssInput.vue';

const model = defineModel<NgrokDialogReturns>({ required: true });
</script>

<template>
  <div>
    <p class="text-caption" style="white-space: pre-line;">
      <i18n-t
        keypath="home.ngrok.dialog.thirdPage.desc"
        tag="label"
        for="home.ngrok.dialog.thirdPage.link"
      >
        <SsA url="https://dashboard.ngrok.com/get-started/your-authtoken">
          {{ $t('home.ngrok.dialog.thirdPage.link') }}
        </SsA>
      </i18n-t>
    </p>
    <SsInput
      v-model="model.token"
      :placeholder="$t('home.ngrok.dialog.thirdPage.inputToken')"
      secret
    />

    <q-checkbox
      v-model="model.isAllUesNgrok"
      :label="$t('home.ngrok.dialog.thirdPage.checkbox')"
      class="q-pt-lg"
      style="font-size: 1rem"
    />
  </div>
</template>
