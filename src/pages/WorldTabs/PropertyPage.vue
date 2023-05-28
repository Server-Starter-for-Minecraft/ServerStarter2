<script setup lang="ts">
import { ref } from 'vue';
import { thumbStyle } from 'src/components/World/scrollBar';
import SideMenuView from 'src/components/World/Property/SideMenuView.vue';
import SsInput from 'src/components/util/base/ssInput.vue';

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
        <div class="col">
          <q-scroll-area
            :thumb-style="thumbStyle"
            class="fit"
          >
            <RouterView/>
          </q-scroll-area>
        </div>
      </div>
    </div>
  </div>
</template>