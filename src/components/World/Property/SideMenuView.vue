<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSystemStore } from 'src/stores/SystemStore';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore';
import { getPropertyGroups } from 'src/components/World/Property/propertyDefinitions';
import { thumbStyle } from '../scrollBar';

interface Prop {
  onScrollTop: () => void;
}
const prop = defineProps<Prop>();

const { t, locale } = useI18n();
const sysStore = useSystemStore();
const propertyStore = usePropertyStore();

/** タブの一覧（外部リソースでタブを定義している場合はその定義，なければアプリ内のタブ） */
const groups = computed(() =>
  getPropertyGroups(
    sysStore.outerResources.serverProperties,
    locale.value,
    (id) => t(`property.group.${id}`)
  )
);

function groupClicked(selectedGroupName: string) {
  propertyStore.selectTab = selectedGroupName;
  prop.onScrollTop();
}
</script>

<template>
  <div style="width: 170px">
    <q-scroll-area
      v-if="propertyStore.searchName === ''"
      :thumb-style="thumbStyle"
      class="fit"
    >
      <template v-for="group in groups" :key="group.id">
        <q-item
          clickable
          :active="propertyStore.selectPropertyTab(group.id)"
          @click="() => groupClicked(group.id)"
        >
          <q-item-section style="width: max-content">{{
            group.label
          }}</q-item-section>
        </q-item>
      </template>
    </q-scroll-area>

    <q-item v-else active>
      <q-item-section style="width: max-content">{{
        $t('property.result')
      }}</q-item-section>
    </q-item>
  </div>
</template>
