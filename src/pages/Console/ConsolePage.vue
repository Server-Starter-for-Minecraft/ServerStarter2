<script setup lang="ts">
import { ref } from 'vue';
import { addConsole, getStore } from './ConsoleStore';

const items = getStore()
const command = ref('')

// コンソール表示
window.ConsoleAPI.onAddConsole((_event, value) => {
  addConsole(value[0])
  let container = document.getElementById('scroll')
  container?.scrollIntoView(false)
  if (container != null) {
    container.scrollTop = container.scrollHeight
  }
})
</script>

<template>
  <div class="q-pa-md">
    <div id="scroll" class="q-pl-sm q-pt-sm console">
      <div v-for="item in items.console" :key="item" style="width: max-content;">
        <p>{{ item }}</p>
      </div>
    </div>
    <div class="row q-pt-md">
      <q-btn color="red" label="stop"/>
      <q-btn color="green" label="reboot"/>
      <q-input filled v-model="command" label="Command"/>
      <q-btn color="primary" label="send"/>
    </div>
  </div>
</template>

<style lang="scss" scoped>
p {
  font-size: 16pt;
  line-height: 1.2;
  margin: 0;
}

.console {
  background-color: lightgray;
  overflow: scroll;
  height: calc(90vh - 100px);
}
</style>