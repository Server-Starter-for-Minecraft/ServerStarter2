<script setup lang="ts">
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';
</script>

<template>
  <div class="column" style="width: 100%; min-height: 100vh;">
    <HeaderView/>
    <SettingTabsView/>
    
    <div class="fit col">
      <router-view />
    </div>
  </div>
</template>