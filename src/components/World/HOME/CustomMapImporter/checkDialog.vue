<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { CustomMapImporterReturns } from './iCustomMapImporter';
import BaseDialogCard from 'src/components/util/baseDialog/baseDialogCard.vue';
import WorldItem from 'src/components/util/WorldItem.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
defineProps<CustomMapImporterReturns>()
</script>

<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <BaseDialogCard
      title="ワールド導入の確認"
      ok-btn-txt="ワールドを導入"
      @ok-click="onDialogOK"
      @close="onDialogCancel"
    >
      <p v-html="'以下のワールドを導入すると、既存のワールドは削除されます<br>既存のワールドを上書きする形で新規ワールドを導入しますか？'" />
      <WorldItem :world="customMap" />
    </BaseDialogCard>
  </q-dialog>
</template>