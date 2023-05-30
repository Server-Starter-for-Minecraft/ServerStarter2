<script setup lang="ts">
import { ref, toRaw, watch } from 'vue';
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
const userInput = ref(mainStore.worldList[mainStore.selectedIdx].properties[prop.settingName]?.value ?? defaultProperty.value)
const showCancel = () => userInput.value !== defaultProperty.value

/**
 * Propertyの編集に使用するEditerを指定
 */
function selectEditer() {
  if (defaultProperty === void 0) return 'undefined'
  if ('enum' in defaultProperty) return 'enum'
  return defaultProperty.type
}

/**
 * 設定を規定値に戻す
 */
function cancelSettings() {
  userInput.value = defaultProperty.value
}

/**
 * userInputが変更された時に設定を保存する
 */
watch(
  userInput,
  (newVal, oldVal) => {
    mainStore.worldList[mainStore.selectedIdx].properties[prop.settingName] = {type: defaultProperty.type, value: newVal}
    window.API.invokeSaveWorldSettings(toRaw(mainStore.worldList[mainStore.selectedIdx]))
  }
)
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
      <q-btn
        v-show="showCancel()"
        flat
        dense
        icon="do_not_disturb_on"
        size="1rem"
        color="red"
        @click="cancelSettings"
      >
        <q-tooltip>
          <p class="text-caption q-ma-none">基本設定の{{ defaultProperty.value }}に設定を戻します</p>
          <p class="text-caption q-ma-none">「システム設定」>「プロパティ」 より基本設定を変更できます</p>
        </q-tooltip>
      </q-btn>
    </q-item-section>

  </q-item>
</template>

<style scoped lang="scss">
h1 {
  font-size: 1.2rem;
}
</style>