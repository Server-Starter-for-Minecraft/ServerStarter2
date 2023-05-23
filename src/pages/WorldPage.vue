<script setup lang="ts">
import HeaderView from 'src/components/World/HeaderView.vue';
import SettingTabsView from 'src/components/World/SettingTabsView.vue';

</script>

<template>
  <div>
    <HeaderView/>
    <SettingTabsView/>
    
    <router-view />
  </div>
</template>