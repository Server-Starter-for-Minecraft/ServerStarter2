<script setup lang="ts">
import { ref } from 'vue';
import { useSystemStore } from 'src/stores/SystemStore';
import { useMainStore } from 'src/stores/MainStore';
import InputFieldView from './InputFieldView.vue';

interface Prop {
  settingName: string
}
const prop = defineProps<Prop>()

// TODO: MainStoreにて読み込むワールドオブジェクトを返す変数の作成後に詳細を作成

const sysStore = useSystemStore()
const mainStore = useMainStore()

const defaultProperty = sysStore.systemSettings.world.properties[prop.settingName]
const userInput = ref(mainStore.worldList[mainStore.selectedIdx].properties[prop.settingName]?.value ?? '')
const syncIcon = () => userInput.value === ''

/**
 * Propertyの編集に使用するEditerを指定
 */
function selectEditer() {
  if (defaultProperty === void 0) return 'undefined'
  if ('enum' in defaultProperty) return 'enum'
  return defaultProperty.type
}
</script>

<template>
  <q-item flat class="bg-transparent">
    
    <q-item-section>
      <div class="text-h6">{{ settingName }}</div>
      <div class="text-caption">設定内容の説明</div>
      <InputFieldView
        v-if="defaultProperty.type === 'string'"
        v-model="userInput"
        :input-type="selectEditer()"
        :enum="defaultProperty.enum"
      />
      <InputFieldView
        v-if="defaultProperty.type === 'number'"
        v-model="userInput"
        :input-type="selectEditer()"
        :min="defaultProperty.min"
        :max="defaultProperty.max"
        :step="defaultProperty.step"
      />
      <InputFieldView
        v-if="defaultProperty.type === 'boolean' || selectEditer() === 'undefined'"
        v-model="userInput"
        :input-type="selectEditer()"
      />
    </q-item-section>

    <q-item-section side>
      <q-icon v-show="syncIcon()" name="sync" size="1.5rem" color="primary">
        <q-tooltip>
          <p class="text-caption q-ma-none">基本設定の{{ defaultProperty.value }}を適用します</p>
          <p class="text-caption q-ma-none">「システム設定」>「プロパティ」 より基本設定を変更できます</p>
        </q-tooltip>
      </q-icon>
      <q-icon v-show="!syncIcon()" name="sync_disabled" size="1.5rem">
        <q-tooltip>
          <p class="text-caption q-ma-none">{{ userInput }}を適用します</p>
        </q-tooltip>
      </q-icon>
    </q-item-section>

  </q-item>
</template>

<style scoped lang="scss">
h1 {
  font-size: 1.2rem;
}
</style>