<script setup lang="ts">
import { AllFileData } from 'app/src-electron/schema/filedata';
import {
  ContentsData,
  showingContentDescription,
  showingContentName,
} from '../../contentsPage';

interface Prop {
  content: AllFileData<ContentsData>;
  contentId: string;
}
defineProps<Prop>();
const checkBoxModel = defineModel<string[]>({ required: true });
</script>

<template>
  <q-item tag="label" v-ripple class="q-pa-none" style="width: 15rem">
    <q-item-section side>
      <q-checkbox
        v-model="checkBoxModel"
        :val="contentId"
        dense
        checked-icon="check_box"
        unchecked-icon="check_box_outline_blank"
        size="lg"
        class="q-pb-xs"
      />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ showingContentName(content) }}</q-item-label>
      <q-item-label caption lines="1">
        {{ showingContentDescription(content) }}
      </q-item-label>
    </q-item-section>
  </q-item>
</template>
