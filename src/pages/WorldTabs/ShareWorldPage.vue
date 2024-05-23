<script setup lang="ts">
import { useMainStore } from 'src/stores/MainStore';
import SsA from 'src/components/util/base/ssA.vue';
import SsI18nT from 'src/components/util/base/ssI18nT.vue';
import ExistRemoteView from 'src/components/World/ShareWorld/ExistRemoteView.vue';
import NewRemoteView from 'src/components/World/ShareWorld/NewRemoteView.vue';

const mainStore = useMainStore();
</script>

<template>
  <q-scroll-area class="full-height" style="flex: 1 1 0">
    <div class="mainField">
      <h1 class="q-pt-lg q-pb-md q-ma-none">{{ $t('shareWorld.title') }}</h1>

      <div class="q-pb-lg text-body2" style="opacity: 0.6">
        <SsI18nT keypath="shareWorld.desc" tag="label" for="shareWorld.link">
          <br />
          <SsA url="https://server-starter-for-minecraft.github.io/ShareWorld">
            {{ $t('shareWorld.link') }}
          </SsA>
        </SsI18nT>
      </div>

      <NewRemoteView v-if="mainStore.world.remote === void 0" />
      <ExistRemoteView v-else :remote="mainStore.world.remote" />
    </div>
  </q-scroll-area>
</template>
