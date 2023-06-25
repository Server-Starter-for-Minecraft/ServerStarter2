<script setup lang="ts">
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

const defaultProperty = sysStore.systemSettings().world.properties[prop.settingName]
const showCancel = () => mainStore.world().properties[prop.settingName] !== defaultProperty.value

/**
 * 設定を規定値に戻す
 */
 function cancelSettings() {
  mainStore.world().properties[prop.settingName] = defaultProperty.value
}

</script>

<template>
  <q-item flat class="bg-transparent">
    
    <q-item-section>
      <div class="text-h6">{{ settingName }}</div>
      <div class="text-caption">設定内容の説明</div>
      <template v-if="$router.currentRoute.value.path === '/system/property'">
        <InputFieldView
          v-model="sysStore.systemSettings().world.properties[settingName].value"
          :property-name="settingName"
        />
      </template>
      <template v-else>
        <InputFieldView
          v-model="mainStore.world().properties[settingName]"
          :property-name="settingName"
        />
      </template>
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