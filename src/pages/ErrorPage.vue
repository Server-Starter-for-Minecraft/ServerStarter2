<script setup lang="ts">
import { useErrorStore } from 'src/stores/ErrorStore';

const store = useErrorStore();

function showTwitter() {
  window.API.sendOpenBrowser('https://twitter.com/CivilT_T');
}

function closeWindow() {
  window.close();
}
</script>

<template>
  <div class="fullscreen justify-center flex flex-center">
    <q-card flat class="bg-transparent">
      <q-card-section horizontal>
        <q-card-section class="col-2 flex flex-center">
          <q-icon name="warning" color="orange" size="5rem" />
        </q-card-section>

        <q-card-section>
          <div>
            <p>{{ $t('bugReport.title') }}</p>
            <p style="text-decoration: underline">{{ store.description }}</p>
            <p v-html="$t('bugReport.desc')"></p>
          </div>

          <div>
            <p>{{ $t('bugReport.cause') }}</p>
            <p>{{ store.error }}</p>
          </div>
        </q-card-section>
      </q-card-section>

      <q-card-actions class="justify-center">
        <!-- TODO: バグ報告フォームの整備 -->
        <q-btn
          color="negative"
          icon="pest_control"
          :label="$t('bugReport.reportBtn')"
          size="1.3rem"
          class="q-mx-md"
        />
        <q-btn
          color="blue-1"
          text-color="blue"
          icon="img:https://cdn.iconscout.com/icon/free/png-512/free-twitter-87-432551.png?f=avif&w=256"
          :label="$t('bugReport.contact')"
          size="1.3rem"
          class="q-mx-md"
          @click="showTwitter"
        />
        <q-btn
          icon="close"
          :label="$t('bugReport.close')"
          size="1.3rem"
          class="q-mx-md"
          @click="closeWindow"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>
