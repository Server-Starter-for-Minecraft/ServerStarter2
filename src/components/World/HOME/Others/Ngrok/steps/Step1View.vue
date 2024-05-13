<script setup lang="ts">
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  next?: (stepName: number) => void;
}

defineProps<Prop>();
const isSkipRegister = defineModel<boolean>({ required: true });

// 最初の画面が読み込まれたときにはアカウント登録画面をスキップしない設定に戻す
isSkipRegister.value = false;
</script>

<template>
  <div>
    <p class="text-caption" style="white-space: pre-line">
      <i18n-t keypath="home.ngrok.dialog.firstPage.desc">
        <u>
          {{ $t('home.ngrok.dialog.firstPage.assumption') }}
        </u>
      </i18n-t>
    </p>

    <div class="column q-gutter-lg q-mt-xs">
      <!-- 大きな登録ボタンを表示 -->
      <SsBtn
        free-width
        :label="$t('home.ngrok.dialog.firstPage.register')"
        color="primary"
        @click="
          () => {
            if (next) {
              next(2);
            }
          }
        "
        class="col q-pa-lg"
        style="font-size: 1.1rem"
      />

      <!-- ボタンを表示 -->
      <SsBtn
        free-width
        :label="$t('home.ngrok.dialog.firstPage.alreadyRegistered')"
        @click="
          () => {
            isSkipRegister = true;
            if (next) {
              next(3);
            }
          }
        "
        class="col q-pa-sm"
      />
    </div>
  </div>
</template>
