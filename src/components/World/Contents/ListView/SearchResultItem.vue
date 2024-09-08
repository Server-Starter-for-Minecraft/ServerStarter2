<script setup lang="ts">
import { $T } from 'src/i18n/utils/tFunc';
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

const titleTooltip = $T('additionalContents.header.search.item.tooltipTitle', {
  title: prop.opt.file.name,
});
const worldNameTooltip =
  prop.opt.wNames.length > 0
    ? $T('additionalContents.header.search.item.tooltipDesc', {
        worldList: prop.opt.wNames.map((n) => `・${n}`).join('\n'),
      })
    : $T('additionalContents.header.search.item.historicalContent');
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
            ? $t('additionalContents.header.search.item.caption', {
                worldList: showingNames(),
              })
            : $t('additionalContents.header.search.item.historicalContent')
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
