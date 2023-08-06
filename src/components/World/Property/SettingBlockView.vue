<script setup lang="ts">
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { useSystemStore } from 'src/stores/SystemStore';
import InputFieldView from './InputFieldView.vue';

interface Prop {
  settingName: string
}
const prop = defineProps<Prop>()
const propertiesModel = defineModel<ServerProperties>({ required: true })

const sysStore = useSystemStore()

const staticDefaultProperty = sysStore.staticResouces.properties[prop.settingName]
const defaultProperty = sysStore.systemSettings.world.properties[prop.settingName] ?? staticDefaultProperty.default

/**
 * 設定を規定値に戻す
 */
function cancelSettings() {
  propertiesModel.value[prop.settingName] = defaultProperty
}
</script>

<template>
  <q-item flat class="bg-transparent">

    <q-item-section>
      <div class="text-h6">{{ settingName }}</div>
      <div class="text-caption" style="opacity: .5;">{{ $t(`property.description['${settingName}']`, '解説が見つかりません') }}</div>
      <InputFieldView v-model="propertiesModel[settingName]" :property-name="settingName" />
    </q-item-section>

    <q-item-section v-show="$router.currentRoute.value.path !== '/system/property'" side>
      <q-btn 
        v-show="propertiesModel[settingName].toString() !== defaultProperty.toString()" 
        flat 
        dense
        icon="do_not_disturb_on" 
        size="1rem" 
        color="red" 
        @click="cancelSettings"
        >
        <q-tooltip>
          <p 
            class="text-caption q-ma-none"
            v-html = "$t('property.resetProperty', { defaultProperty: defaultProperty })"
          />
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