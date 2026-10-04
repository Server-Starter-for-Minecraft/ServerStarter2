<script setup lang="ts">
import { ViewStyleSetting } from 'app/src-electron/schema/system';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

interface Prop {
  /** 表示形式を切り替える画面（システム設定の表示形式の項目） */
  target: keyof ViewStyleSetting;
}
defineProps<Prop>();
const emit = defineEmits<{
  /** 表示形式が変更された */
  (e: 'change', value: ViewStyleSetting[keyof ViewStyleSetting]): void;
}>();

const sysStore = useSystemStore();
const tooltipOffset = [0, 0] as [number, number];
</script>

<template>
  <!-- カード表示とリスト表示を切り替え、システム設定に保存する -->
  <q-btn-toggle
    v-model="sysStore.systemSettings.user.viewStyle[target]"
    @update:model-value="(v) => emit('change', v)"
    outline
    toggle-color="primary"
    :options="[
      { icon: 'grid_view', value: 'card', slot: 'card' },
      { icon: 'list', value: 'list', slot: 'list' },
    ]"
  >
    <template v-slot:card>
      <SsTooltip :name="$t('general.viewStyle.card')" :offset="tooltipOffset" />
    </template>
    <template v-slot:list>
      <SsTooltip :name="$t('general.viewStyle.list')" :offset="tooltipOffset" />
    </template>
  </q-btn-toggle>
</template>
