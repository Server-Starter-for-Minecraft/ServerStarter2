<script setup lang="ts">
import BackupWorldView from 'src/components/World/MoreSettings/BackupWorldView.vue';
import WorldFolderView from 'src/components/World/HOME/OtherSettings/WorldFolderView.vue';

</script>

<template>
  <h1>{{ $t('home.worldOperation') }}</h1>
  <BackupWorldView />

  <h1 class="q-pt-none">{{ $t('home.saveWorld.title') }}</h1>
  <WorldFolderView />
</template>