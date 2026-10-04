<script setup lang="ts">
import { computed } from 'vue';
import {
  AllFileData,
  DatapackData,
  ModData,
  PluginData,
} from 'app/src-electron/schema/filedata';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import BaseActionsCard from '../utils/BaseActionsCard.vue';
import { ContentType, useContentActions } from './contentActions';
import { toDisplayText } from './contentFilter';

type T = DatapackData | ModData | PluginData;

interface Prop {
  contentType: ContentType;
  content: AllFileData<T>;
  isDelete?: boolean;
  color?: string;
}
const prop = defineProps<Prop>();

const { addContent: add, deleteContent: remove } = useContentActions();
const addContent = () => add(prop.contentType, prop.content);
const deleteContent = () => remove(prop.contentType, prop.content);

const transformedName = computed(() => toDisplayText(prop.content.name));
const transformedDescription = computed(() =>
  'description' in prop.content ? toDisplayText(prop.content.description) : ''
);
</script>

<template>
  <BaseActionsCard
    :style="{
      'border-radius': '6px',
      'background-color': color,
    }"
  >
    <template #default>
      <q-item class="q-pr-sm">
        <q-item-section>
          <q-item-label class="contentsName text-omit">
            {{ transformedName }}
            <SsTooltip
              :name="transformedName"
              anchor="bottom start"
              self="center start"
            />
          </q-item-label>
          <q-item-label
            v-if="'description' in content"
            class="text-omit"
            style="opacity: 0.7"
          >
            {{ transformedDescription }}
            <SsTooltip
              :name="transformedDescription"
              anchor="bottom start"
              self="center start"
            />
          </q-item-label>
        </q-item-section>

        <q-item-section v-if="isDelete" side>
          <q-btn
            dense
            flat
            stack
            color="negative"
            icon="close"
            size="1rem"
            @click="deleteContent"
          >
            <div
              class="text-negative text-center full-width"
              style="font-size: 0.8rem"
            >
              {{ $t('general.delete') }}
            </div>
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
            <div
              class="text-primary text-center full-width"
              style="font-size: 0.8rem"
            >
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
