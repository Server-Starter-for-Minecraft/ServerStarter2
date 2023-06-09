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
      <q-card-section horizontal>
        <q-icon name="warning" color="orange" size="40px" class="q-pl-lg" style="margin: auto 0;"/>

        <q-card-section>
          <q-card-section>
            <h1>{{ store.dialogTitle }}</h1>
          </q-card-section>
    
          <q-card-section class="q-pt-none">
            <p v-for="line in store.dialogMessage" :key="line">{{ line }}</p>
          </q-card-section>
    
          <q-card-actions align="right">
            <template v-for="btn in store.dialogBtns" :key="btn">
              <q-btn flat :label="btn.label" :color="btn.color" @click="btn.action" v-close-popup />
            </template>
          </q-card-actions>
        </q-card-section>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
h1 {
  font-size: 1.3rem;
  font-weight: bold;
  padding: 0;
}

p {
  margin: 0;
  margin-bottom: 5px;
}
</style>