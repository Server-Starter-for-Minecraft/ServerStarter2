<script setup lang="ts">
import BootSettingsView from 'src/components/World/HOME/Others/BootSettingsView.vue';
import BackupWorldView from 'src/components/World/Others/BackupWorldView.vue';
import WorldFolderView from 'src/components/World/Others/WorldFolderView.vue';

</script>

<template>
  <q-scroll-area
    ref="scrollAreaRef"
    class="full-height"
    style="flex: 1 1 0;"
  >
    <div class="mainField">
      <!-- Others -->
      <h1 class="q-pt-lg">{{ $t('home.setting.title') }}</h1>
      <BootSettingsView />

      <h1>{{ $t('others.backup.title') }}</h1>
      <BackupWorldView />

      <h1>{{ $t('others.worldFolder.title') }}</h1>
      <WorldFolderView />
    </div>
  </q-scroll-area>
</template>