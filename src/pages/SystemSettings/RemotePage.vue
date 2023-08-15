<script setup lang="ts">
import { useQuasar } from 'quasar';
import { useSystemStore } from 'src/stores/SystemStore';
import GithubCard from 'src/components/SystemSettings/Remote/github/GithubCard.vue';
import AddContentsCard from 'src/components/util/AddContentsCard.vue';
import NewRemoteDialog from 'src/components/SystemSettings/Remote/NewRemoteDialog.vue';

const $q = useQuasar()
const sysStore = useSystemStore()

function addRemote() {
  $q.dialog({
    component: NewRemoteDialog
  })
}
</script>

<template>
  <div class="q-pa-md">
    <p class="q-my-sm text-body2" style="opacity: .6;">
      {{ $t('shareWorld.descriptRemote') }}
    </p>

    <div class="row">
      <div class="row q-py-md q-gutter-md">
        <div>
          <!-- 13remはssBtnの固定サイズ、24pxは片側余白幅 -->
          <AddContentsCard
            :label="$t('shareWorld.addRemote.title')"
            min-height="250px"
            :card-style="{ 'border-radius': '6px' }"
            @click="addRemote"
            style="min-width: calc(13rem + 24px * 2);"
          />
        </div>
        <div v-for="n in sysStore.systemSettings.remote.length" :key="sysStore.systemSettings.remote[n-1].pat">
          <GithubCard v-model="sysStore.systemSettings.remote[n-1]" show-unlink />
        </div>
      </div>
    </div>
  </div>
</template>