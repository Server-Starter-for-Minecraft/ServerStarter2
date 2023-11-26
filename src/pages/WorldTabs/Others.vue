<script setup lang="ts">
import BackupWorldView from 'src/components/World/Others/BackupWorldView.vue';
import WorldFolderView from 'src/components/World/Others/WorldFolderView.vue';

</script>

<template>
  <h1>{{ $t('others.backup.title') }}</h1>
  <BackupWorldView />

  <h1 class="q-pt-none">{{ $t('others.worldFolder.title') }}</h1>
  <WorldFolderView />
</template>