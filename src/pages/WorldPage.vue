<script setup lang="ts">
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';
</script>

<template>
  <div class="column fit">
    <HeaderView/>
    <SettingTabsView/>
    
    <div class="fit" style="flex: 1 1 0;">
      <router-view />
    </div>
  </div>
</template>