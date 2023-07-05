<script setup lang="ts">
import { computed } from 'vue';
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { useSystemStore } from 'src/stores/SystemStore';
import InputFieldView from './InputFieldView.vue';


interface Prop {
  modelValue: ServerProperties
  settingName: string
}
const prop = defineProps<Prop>()
const emit = defineEmits(['update:model-value'])

const propertiesModel = computed({
  get() {
    return prop.modelValue;
  },
  set(newValue) {
    emit('update:model-value', newValue);
  },
})


const sysStore = useSystemStore()

const defaultProperty = sysStore.staticResouces.properties[prop.settingName]
const showCancel = () => propertiesModel.value[prop.settingName] !== defaultProperty.default

/**
 * 設定を規定値に戻す
 */
function cancelSettings() {
  propertiesModel.value[prop.settingName] = defaultProperty.default
}
</script>

<template>
  <q-item flat class="bg-transparent">

    <q-item-section>
      <div class="text-h6">{{ settingName }}</div>
      <div class="text-caption">設定内容の説明</div>
      <InputFieldView
        v-model="propertiesModel[settingName]"
        :property-name="settingName"
      />
    </q-item-section>

    <q-item-section v-show="$router.currentRoute.value.path !== '/system/property'" side>
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
          <p class="text-caption q-ma-none">基本設定の{{ defaultProperty.default }}に設定を戻します</p>
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