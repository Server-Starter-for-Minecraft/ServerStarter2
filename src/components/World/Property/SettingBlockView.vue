<script setup lang="ts">
import { ServerProperties } from 'app/src-electron/schema/serverproperty';
import { useSystemStore } from 'src/stores/SystemStore';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import InputFieldView from './InputFieldView.vue';

interface Prop {
  settingName: string;
}
const prop = defineProps<Prop>();
const propertiesModel = defineModel<ServerProperties>({ required: true });

const sysStore = useSystemStore();

const staticDefaultProperty = sysStore.staticResouces.properties[
  prop.settingName
] ?? { type: 'string', default: '' };
const defaultProperty =
  sysStore.systemSettings.world.properties[prop.settingName] ??
  staticDefaultProperty.default;

/**
 * 設定を規定値に戻す
 */
function cancelSettings() {
  propertiesModel.value[prop.settingName] = defaultProperty;
}
</script>

<template>
  <q-item flat class="bg-transparent">
    <q-item-section>
      <div class="text-h6">{{ settingName }}</div>
      <div class="text-caption" style="opacity: 0.5">
        {{
          $t(
            `property.description['${settingName}']`,
            $t('property.description.notFound')
          )
        }}
      </div>
      <InputFieldView v-model="propertiesModel" :property-name="settingName" />
    </q-item-section>

    <q-item-section
      v-show="$router.currentRoute.value.path !== '/system/property'"
      side
    >
      <q-btn
        v-show="
          propertiesModel[settingName]?.toString() !== defaultProperty.toString()
        "
        flat
        dense
        icon="do_not_disturb_on"
        size="1rem"
        color="negative"
        @click="cancelSettings"
      >
        <SsTooltip
          :name="
            $t('property.resetProperty', {
              defaultProperty:
                defaultProperty !== '' ? defaultProperty : $t('property.empty'),
            })
          "
          anchor="center middle"
          self="top middle"
        />
      </q-btn>
    </q-item-section>
  </q-item>
</template>

<style scoped lang="scss">
h1 {
  font-size: 1.2rem;
}
</style>
