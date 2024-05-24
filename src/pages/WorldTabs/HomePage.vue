<script setup lang="ts">
import { ref } from 'vue';
import { useSystemStore } from 'src/stores/SystemStore';
import { setScrollTop } from 'src/components/World/HOME/scroll';
import NgrokView from 'src/components/World/HOME/Others/NgrokView.vue';
import WorldDeleteView from 'src/components/World/HOME/Others/WorldDeleteView.vue';
import RunningBtn from 'src/components/World/HOME/RunningBtn.vue';
import VersionSelecterView from 'src/components/World/HOME/Top/VersionSelecterView.vue';
import WorldIconView from 'src/components/World/HOME/Top/WorldIconView.vue';
import WorldNameView from 'src/components/World/HOME/Top/WorldNameView.vue';

const sysStore = useSystemStore();
const scrollAreaRef = ref();

/**
 * 画面を一番上に遷移
 */
function scrollTop() {
  scrollAreaRef.value.scrollTop = 0;
}
setScrollTop(scrollTop);
</script>

<template>
  <div ref="scrollAreaRef" class="vertical-scroll">
    <div class="mainField">
      <RunningBtn
        to="/console"
        :text-font-size="1.1"
        class="full-width q-mt-xl"
      />

      <!-- TOP -->
      <div class="row justify-center q-mt-sm q-pb-lg q-gutter-lg">
        <div class="col" style="min-width: 12rem">
          <h1 class="q-pt-none">{{ $t('home.worldName.title') }}</h1>
          <WorldNameView />

          <h1 class="q-pt-md">{{ $t('home.version.title') }}</h1>
          <VersionSelecterView />
        </div>
        <WorldIconView />
      </div>

      <!-- Others -->
      <h1 class="q-pt-lg">{{ $t('home.ngrok.title') }}</h1>
      <NgrokView />

      <h1 class="q-pt-lg">{{ $t('systemsetting.general.autoShutdown') }}</h1>
      <q-checkbox
        v-model="sysStore.systemSettings.user.autoShutDown"
        :label="$t('systemsetting.general.shutdownDesc')"
        style="font-size: 1rem"
      />

      <WorldDeleteView />
    </div>
  </div>
</template>
