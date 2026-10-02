<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { ConsoleData, MatchedConsoleData } from 'src/schema/console';
import { ansiStyleToCss } from './ansi';
import { overlayMatches } from './consoleLine';

interface Prop {
  /** 表示する行のデータ（検索中は検索結果を反映したデータ） */
  item: ConsoleData | MatchedConsoleData;
}
const prop = defineProps<Prop>();

const $q = useQuasar();

/**
 * 文字色などの装飾と検索結果を反映した表示用の断片
 *
 * 行ごとのコンポーネントで算出することで、行が追加された際に既存の行を再計算しないようにする
 */
const pieces = computed(() => {
  const item = prop.item;
  if ('matches' in item) {
    const text = item.matches.map((m) => m.text).join('');
    return overlayMatches(item.segments ?? [{ text, style: {} }], item.matches);
  }
  const segments = item.segments ?? [{ text: item.chunk, style: {} }];
  return segments.map((s) => ({ ...s, isMatch: false }));
});
</script>

<template>
  <span
    v-for="(piece, pieceIndex) in pieces"
    :key="pieceIndex"
    :class="piece.isMatch ? 'highlight-match' : ''"
    :style="ansiStyleToCss(piece.style, $q.dark.isActive)"
    >{{ piece.text }}</span
  >
</template>
