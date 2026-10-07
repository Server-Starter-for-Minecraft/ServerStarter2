<script setup lang="ts">
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

/**
 * 追加コンテンツ画面の各区画（「追加済み〇〇」「〇〇を追加」）の見出し行
 *
 * 区画名と、その区画に対応する保存場所を開くボタンを横に並べる
 * 幅が足りない場合は区画名を優先して表示し、ボタンの表示名を省略する（全文はTooltipで表示）
 */
interface Prop {
  /** 区画名 */
  label: string;
  /** 保存場所を開くボタンの表示名 */
  folderLabel: string;
}
defineProps<Prop>();

const emit = defineEmits<{
  /** 保存場所を開くボタンが押された */
  openFolder: [];
}>();
</script>

<template>
  <div class="row justify-between items-center no-wrap">
    <span class="text-caption text-no-wrap q-mr-sm">{{ label }}</span>
    <q-btn
      dense
      flat
      color="grey"
      size=".7rem"
      @click="emit('openFolder')"
      class="folderBtn"
    >
      <!-- 表示名を1行に収め、はみ出した分は省略記号で表示する -->
      <div class="row items-center no-wrap" style="min-width: 0">
        <q-icon name="folder" left />
        <span class="ellipsis">{{ folderLabel }}</span>
      </div>
      <SsTooltip :name="folderLabel" anchor="bottom middle" self="top middle" />
    </q-btn>
  </div>
</template>

<style scoped lang="scss">
.folderBtn {
  border-color: transparent;
  min-width: 0;
}
</style>
