<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import worldVue from './WorldVue.vue';
import NewWorldBtn from './NewWorldBtn.vue';
import SsSelect from '../util/base/ssSelect.vue';
import SsInput from '../util/base/ssInput.vue';

const store = useMainStore()

const text = ref('');
const sortType = ref('名前');
const sortTypes = ['名前', '最終プレイ'];
const hasWorldData = store.searchWorld('').length !== 0
</script>

<template>
  <q-item class="q-pa-md mainField" style="width: 100%;">
    <q-item-section>
      <div class="row">
        <new-world-btn/>
      
        <ss-input
          v-model="text"
          label="検索"
          @clear="text = ''"
          class="q-px-md"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </ss-input>
      </div>
    </q-item-section>

    <q-item-section side>
      <ss-select
        v-model="sortType"
        :options="sortTypes"
        label="並び替え"
        style="width: 150px"
      />
    </q-item-section>
  </q-item>

  <q-separator class="q-mx-md" />

  <q-virtual-scroll
    :items="store.searchWorld(text)"
    separator
    v-slot="{ item, index }"
    class="q-pa-sm mainField fit"
    :items-size="500"
    style="flex: 1 1 0"
  >
    <world-vue :world="item" :idx="index" />
  </q-virtual-scroll>
  <div v-show="store.searchWorld(text).length == 0" class="col row justify-center items-center">
    <p v-show="hasWorldData" class="q-pa-none">おや？ お探しのワールドは存在しないようです</p>
    <div v-show="!hasWorldData">
      <p class="q-pa-none text-center">むむ？ ワールドデータが存在しないようです</p>
      <p class="q-pa-none text-center">「新規作成」よりワールドデータを作成しましょう！</p>
    </div>
  </div>
</template>