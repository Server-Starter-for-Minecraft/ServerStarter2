<script setup lang="ts">
import { ref } from 'vue'

interface Prop {
  title: string
  text: string[]
  btnText: string
  showDialog?: boolean
  dialogTitle?: string
  dialogText?: string[]
  onAction: () => void
}
const prop = defineProps<Prop>()

const dialogModel = ref(false)

function dialog() {
  if (prop.showDialog) {
    dialogModel.value = true
  }
  else {
    prop.onAction()
  }
}
</script>

<template>
  <div class="q-py-xl">
    <q-card flat bordered class="full-width bg-transparent dangerCard">
      <q-card-section horizontal>
        <div class="col q-pa-md">
          <h1>{{ title }}</h1>
          <p v-for="line in text" :key="line">{{ line }}</p>
        </div>
  
        <q-card-actions vertical class="justify-around">
          <q-btn color="red" :label="btnText" size="1rem" @click="dialog" class="q-mr-sm"/>
        </q-card-actions>
      </q-card-section>
    </q-card>
  </div>

  <q-dialog v-model="dialogModel">
    <q-card>
      <q-card-section>
        <div class="text-h6 text-bold">{{ dialogTitle }}</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <p v-for="line in dialogText" :key="line">{{ line }}</p>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup/>
        <q-btn flat label="Yes" color="red" @click="onAction" v-close-popup/>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
.dangerCard {
  border-radius: 10px;
  border-color: red;
}

h1 {
  font-size: 1.3rem;
  font-weight: bold;
  padding: 0;
  padding-bottom: 10px;
}

p {
  margin: 0;
  margin-bottom: 5px;
}
</style>