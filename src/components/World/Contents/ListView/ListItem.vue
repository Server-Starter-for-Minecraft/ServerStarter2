<script setup lang="ts">
import { ref } from 'vue';
import { AllFileData } from 'app/src-electron/schema/filedata';
import SsIconBtn from 'src/components/util/base/ssIconBtn.vue';
import {
  ContentsData,
  deleteContent,
  showingContentDescription,
  showingContentName,
} from '../contentsPage';

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod';
  content: AllFileData<ContentsData>;
}
defineProps<Prop>();

const hover = ref(false);
</script>

<template>
  <q-item @mouseenter="hover = true" @mouseleave="hover = false">
    <q-item-section>
      <q-item-label style="font-size: 1rem">
        {{ showingContentName(content) }}
      </q-item-label>
      <q-item-label v-if="'description' in content" style="opacity: 0.7">
        {{ showingContentDescription(content) }}
      </q-item-label>
    </q-item-section>

    <q-item-section side v-show="hover">
      <div class="row q-gutter-x-sm">
        <SsIconBtn flat icon="info" tooltip="詳細情報" @click="() => {}" />
        <q-separator vertical />
        <SsIconBtn
          flat
          icon="close"
          tooltip="削除"
          color="negative"
          @click="() => deleteContent(contentType, content)"
        />
      </div>
    </q-item-section>
  </q-item>
</template>
