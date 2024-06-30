<script setup lang="ts">
import { AllFileData } from 'app/src-electron/schema/filedata';
import SsTooltip from 'src/components/util/base/ssTooltip.vue';
import BaseActionsCard from '../../utils/BaseActionsCard.vue';
import {
  addContent,
  ContentsData,
  ContentsType,
  deleteContent,
  showingContentDescription,
  showingContentName,
} from '../contentsPage';

interface Prop {
  contentType: ContentsType;
  content: AllFileData<ContentsData>;
  isDelete?: boolean;
  color?: string;
}
defineProps<Prop>();
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
            {{ showingContentName(content) }}
            <SsTooltip
              :name="showingContentName(content)"
              anchor="bottom start"
              self="center start"
            />
          </q-item-label>
          <q-item-label
            v-if="'description' in content"
            class="text-omit"
            style="opacity: 0.7"
          >
            {{ showingContentDescription(content) }}
            <SsTooltip
              :name="showingContentDescription(content)"
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
            @click="deleteContent($q, contentType, content)"
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
            @click="addContent(contentType, content)"
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
