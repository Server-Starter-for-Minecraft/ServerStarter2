<script setup lang="ts">
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { usePropertyStore } from 'src/stores/WorldTabs/PropertyStore';
import { LockedProperties } from './lockedProperties';
import SettingBlockView from './SettingBlockView.vue';

interface Prop {
  /** 編集不可なプロパティ（未指定の場合はすべて編集可能） */
  lockedProperties?: LockedProperties;
  /**
   * ワールドの Minecraft のバージョン（プロパティの定義をバージョンに合わせて選ぶ）
   *
   * ワールドに依らない設定（システム設定の標準プロパティなど）では指定しない
   */
  versionId?: string;
}
defineProps<Prop>();
const model = defineModel<ServerProperties>({ required: true });
const propertyStore = usePropertyStore();
</script>

<template>
  <div v-if="propertyStore.searchProperties(model, versionId).length !== 0">
    <template
      v-for="key in propertyStore.searchProperties(model, versionId)"
      :key="key"
    >
      <SettingBlockView
        v-model="model"
        :setting-name="key"
        :locked-reason="lockedProperties?.[key]"
        :version-id="versionId"
      />
    </template>
  </div>
  <div v-else>
    <p class="q-pl-md" style="font-size: 0.8rem; padding-top: 14px">
      {{ $t('property.notFound') }}
    </p>
  </div>
</template>
