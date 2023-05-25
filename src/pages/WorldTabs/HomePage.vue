<script setup lang="ts">
import { ref } from 'vue';
import { useMainStore } from 'src/stores/MainStore';
import SsInput from 'src/components/util/base/ssInput.vue';
import SsSelect from 'src/components/util/base/ssSelect.vue';
import ExpansionView from 'src/components/World/HOME/expansionView.vue';

const mainStore = useMainStore()
const world = mainStore.worldList[mainStore.selectedIdx]

const customWorldPath = ref(null)
const soloWorldName = ref('個人ワールドを選択')
const showSoloWorld = ref(false)
</script>

<template>
  <div class="mainField">
    <!-- TODO: 入力欄のバリデーション -->
    <h1 class="q-mt-none">ワールド名</h1>
    <SsInput
      v-model="world.name"
      label="半角英数字でワールド名を入力"
    />

    <!-- TODO: バージョン一覧の取得 -->
    <h1>バージョン</h1>
    <div class="row">
      <SsSelect
        v-model="world.version.type"
        label="サーバーの種類を選択"
        class="col-5 q-pr-md"
      />
      <SsSelect
        v-model="world.version.id"
        label="バージョンを選択"
        class="col"
      />
    </div>

    <!-- TODO: 配布ワールドは新規World以外でも導入できるようにするのか？ -->
    <!-- TODO: 配布ワールドだけでなく、既存の個人ワールドについても.minecraftがある場合は導入できるようにする？ -->
    <!-- 個人ワールドのデフォルトパスは変更できるようにする -->
    <ExpansionView title="既存ワールドの導入">
      <q-toggle v-model="showSoloWorld" :label="showSoloWorld ? '個人ワールドを導入する' : '配布ワールドをZipファイルより導入する'"/>
      <p v-show="!showSoloWorld" class="text-caption q-ma-none q-mt-md">インターネットよりダウンロードしたワールド（配布ワールド）を導入する</p>
      <p v-show="showSoloWorld" class="text-caption q-ma-none q-mt-md">このPC上にあるMinecraftの個人ワールドを導入する</p>
      <q-file
        v-show="!showSoloWorld"
        v-model="customWorldPath"
        label="配布ワールド(.zip)を選択"
        clearable
        accept=".zip"
      >
        <template v-slot:prepend>
          <q-icon name="attach_file" />
        </template>
      </q-file>
      <SsSelect v-show="showSoloWorld" v-model="soloWorldName"/>
    </ExpansionView>
    <!-- <input type="file" webkitdirectory directory multiple/> -->

    <!-- TODO: memoryがsizeとunitのpropertyを有していないバグをバックに報告 -->
    <ExpansionView title="起動設定">
      <div class="row" style="max-width: 300px;">
        <SsInput
          v-model="world.memory"
          label="メモリサイズ"
          class="col q-pr-md"
        />
        <SsSelect
          v-model="world.memory"
          :options="['MB', 'GB', 'TB']"
          label="単位"
          class="col-3"
        />
      </div>

      <SsInput
        v-model="world.javaArguments"
        label="JVM引数"
        class="q-pt-md"
      />
    </ExpansionView>


  </div>
</template>