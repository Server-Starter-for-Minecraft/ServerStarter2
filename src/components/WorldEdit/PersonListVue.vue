<script setup lang="ts">
import TitleVue from './TitleVue.vue';
import RegistField from './PersonList/RegistField.vue'
import Players from './PersonList/PlayersVue.vue'
import Groups from './PersonList/GroupsVue.vue'
</script>

<template>
  <TitleVue title="Person List"/>

  <q-separator class="q-my-sm"/>
  <RegistField/>
  <q-separator class="q-my-sm"/>

  <Groups/>

  <Players/>
</template>