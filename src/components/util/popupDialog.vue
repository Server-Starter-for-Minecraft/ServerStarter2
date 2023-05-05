<script setup lang="ts">
import { useDialogStore } from 'src/stores/DialogStore';

const store = useDialogStore()

if (store.dialogBtns === void 0 || store.dialogBtns.length===0) {
  store.dialogBtns = [{label: 'OK', color: 'primary'}]
}
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
        <template v-for="btn in store.dialogBtns" :key="btn">
          <q-btn flat :label="btn.label" :color="btn.color" @click="btn.action" v-close-popup />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>