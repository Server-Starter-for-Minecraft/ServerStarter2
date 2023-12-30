<script setup lang="ts">
import { AllFileData, DatapackData, ModData, PluginData } from 'app/src-electron/schema/filedata';
import { useMainStore } from 'src/stores/MainStore';
import BaseActionsCard from '../utils/BaseActionsCard.vue';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';

type T = DatapackData | ModData | PluginData

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod'
  content: AllFileData<T>
  isDelete?: boolean
  color?: string
}
const prop = defineProps<Prop>()

const mainStore = useMainStore()

function addContent() {
  (mainStore.world.additional[`${prop.contentType}s`] as AllFileData<T>[]).push(prop.content)
}

function deleteContent() {
  mainStore.world.additional[`${prop.contentType}s`].splice(
    mainStore.world.additional[`${prop.contentType}s`].map(c => c.name).indexOf(prop.content.name), 1
  )
}

const transformedName = prop.content.name.replace(/§./g, '').trim();
let transformedDescription = '';
// 条件分岐で content.description の有無を確認
if ('description' in prop.content && prop.content.description) {
  transformedDescription = prop.content.description.replace(/§./g, '').trim();
}
</script>

<template>
  <BaseActionsCard :style="{
    'border-radius': '6px',
    'background-color': color
  }">
    <template #default>
      <q-item class="q-pr-sm">
        <q-item-section>
          <q-item-label class="contentsName text-omit">
            {{ transformedName }}
            <SsTooltip :name="transformedName" anchor="bottom start" self="center start" />
          </q-item-label>
          <q-item-label v-if="'description' in content" class="text-omit" style="opacity: .7;">
            {{ content.description.replace(/§./g, "").trim() }}
            <SsTooltip :name="transformedDescription" anchor="bottom start" self="center start" />
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="isDelete" side>
          <q-btn
            dense
            flat
            stack
            color="red"
            icon="close"
            size="1rem"
            @click="deleteContent"
          >
            <div class="text-red text-center full-width" style="font-size: .8rem;">
              {{ $t('general.delete') }}</div>
          </q-btn>
        </q-item-section>
        <q-item-section v-else side>
          <q-btn
            dense
            flat
            stack
            color="primary"
            icon="add"
            size="1rem"
            @click="addContent"
          >
            <div class="text-primary text-center full-width" style="font-size: .8rem;">
              {{ $t('additionalContents.install') }}
            </div>
          </q-btn>
        </q-item-section>
      </q-item>
    </template>
  </BaseActionsCard>
</template>

<style scoped lang="scss">
.contentsName {
  font-size: 1.5rem;
}
</style>