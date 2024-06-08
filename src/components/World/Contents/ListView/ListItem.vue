<script setup lang="ts">
import { AllFileData } from 'app/src-electron/schema/filedata';
import { ContentsData } from '../contentsPage';

interface Prop {
  contentType: 'datapack' | 'plugin' | 'mod';
  content: AllFileData<ContentsData>;
}
defineProps<Prop>();
</script>

<template>
  <q-item> </q-item>
</template>
