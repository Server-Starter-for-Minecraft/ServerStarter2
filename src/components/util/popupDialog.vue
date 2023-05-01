<script setup lang="ts">
import { useDialogStore } from 'src/stores/DialogStore';

const store = useDialogStore()
</script>

<template>
  <q-dialog v-model="store.dialogModel">
    <q-card>
      <q-card-section>
        <div class="text-h6">Alert</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p>{{ store.dialogMessage }}</p>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>