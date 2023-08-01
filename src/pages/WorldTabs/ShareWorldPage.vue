<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import ExistRemoteView from 'src/components/World/ShareWorld/ExistRemoteView.vue';
import NewRemoteView from 'src/components/World/ShareWorld/NewRemoteView.vue';

const mainStore = useMainStore()

function openHP() {
  window.API.sendOpenBrowser('https://civiltt.github.io/ServerStarter/ShareWorld')
}
</script>

<template>
  <div class="mainField">
    <h1 class="q-pt-lg q-pb-md q-ma-none">{{ $t('shareWorld.title') }}</h1>
    
    <div class="q-pb-lg text-body2" style="opacity: .6;">
      <i18n-t keypath="shareWorld.desc" tag="label" for="shareWorld.link">
        <a href="javascript:void(0)" @click="openHP" class="text-primary">{{ $t('shareWorld.link') }}</a>
      </i18n-t>
    </div>

    <NewRemoteView v-if="mainStore.world.remote === void 0" />
    <ExistRemoteView v-else />
  </div>
</template>