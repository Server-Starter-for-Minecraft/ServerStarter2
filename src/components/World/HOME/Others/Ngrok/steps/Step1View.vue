<script setup lang="ts">
import SsBtn from 'src/components/util/base/ssBtn.vue';

interface Prop {
  next?: (stepName: number) => void
}

defineProps<Prop>()
const isSkipRegister = defineModel<boolean>({ required: true })

// 最初の画面が読み込まれたときにはアカウント登録画面をスキップしない設定に戻す
isSkipRegister.value = false
</script>

<template>
  <div>
    <p class="text-caption">
      本ソフトはポート開放不要化にNgrokを用います<br>
      アカウントをお持ちでない方は新規作成をお願いします<br>
      ※アカウントは有料版もありますが，<u>本ソフトは無料アカウントでの利用を想定しています</u>
    </p>

    <div class="column q-gutter-lg q-mt-xs">
      <!-- 大きな登録ボタンを表示 -->
      <SsBtn
        free-width
        label="アカウントを新規作成"
        color="primary"
        @click="() => {if (next) { next(2) }}"
        class="col q-pa-lg"
        style="font-size: 1.1rem;"
      />
    
      <!-- ボタンを表示 -->
      <SsBtn
        free-width
        label="すでにアカウントをお持ちの方"
        @click="() => {
          isSkipRegister = true
          if (next) { next(3) }
        }"
        class="col q-pa-sm"
      />
    </div>
  
  </div>
</template>