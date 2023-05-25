<script setup lang="ts">
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';
import { ref } from 'vue';

const searchProp = ref('')
</script>

<template>
  <div class="mainField">
    <div class="column fit">
      <SsInput
        v-model="searchProp"
        label="プロパティを検索"
        class="q-py-md"
      />
  
      <div class="row fit" style="flex: 1 1 0;">
        <SideMenuView/>
        <q-separator vertical inset/>
      </div>
    </div>
  </div>
</template>