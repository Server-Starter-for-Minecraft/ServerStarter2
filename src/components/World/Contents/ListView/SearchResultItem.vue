<script setup lang="ts">
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import { OptContents } from '../contentsPage';

interface Prop {
  itemProps: any;
  opt: OptContents;
}
const prop = defineProps<Prop>();

const showingNames = () => {
  /** 表示するアイテムの個数 */
  const showingItemCount = 3;
  // 省略したワールドがある場合は省略記号を入れる
  const endStr = prop.opt.wNames.length > showingItemCount ? '...' : '';

  return `${prop.opt.wNames
    .slice(0, Math.min(prop.opt.wNames.length, showingItemCount))
    .join(', ')}${endStr}`;
};

const titleTooltip = `タイトル：${prop.opt.file.name}`;
const worldNameTooltip =
  prop.opt.wNames.length > 0
    ? `導入されているワールドの一覧\n${prop.opt.wNames
        .map((n) => `・${n}`)
        .join('\n')}`
    : '導入履歴のあるコンテンツ';
</script>

<template>
  <q-item v-bind="itemProps">
    <q-item-section>
      <q-item-label style="font-size: 0.8rem">
        {{ opt.file.name }}
      </q-item-label>
      <q-item-label caption>
        {{
          opt.wNames.length > 0
            ? `${showingNames()}に存在します`
            : '導入履歴のあるコンテンツ'
        }}
      </q-item-label>
    </q-item-section>
    <SsTooltip
      :name="`${titleTooltip}\n${worldNameTooltip}`"
      anchor="center start"
      self="top start"
    />
  </q-item>
</template>
