<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { getCssVar, useDialogPluginComponent } from 'quasar';
import { Locale } from 'app/src-electron/schema/system';
import { assets } from 'src/assets/assets';
import { useSystemStore } from 'src/stores/SystemStore';
import SsSelect from '../util/base/ssSelect.vue';
import SsA from '../util/base/ssA.vue';
import SsBtn from '../util/base/ssBtn.vue';

defineEmits({...useDialogPluginComponent.emitsObject})
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

const t = useI18n()
const sysStore = useSystemStore()
const isAgree = ref(false)

const localeOptions: { value: Locale, label: string }[] = [
  { value: 'ja', label: '日本語' },
  { value: 'en-US', label: 'English' }
]

function changeLocale(loc: Locale) {
  t.locale.value = loc
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card flat>
      <q-card-section>
        <div style="font-size: 1.5rem;">ServerStarter2へようこそ！</div>
      </q-card-section>

      <q-card-section>
        <h1>言語 / Language</h1>
        <SsSelect
          dense
          v-model="sysStore.systemSettings.user.language"
          @update:model-value="newVal => changeLocale(newVal)"
          :options="localeOptions"
          option-label="label"
          option-value="value"
        />
      </q-card-section>

      <q-card-section class="q-mt-md">
        <h1>利用規約</h1>
        <p class="text-caption" style="opacity: .6;">
          ServerStarter2の利用規約は<SsA url="https://civiltt.github.io/ServerStarter/credit">ホームページ</SsA>より閲覧可能です<br>
          ご利用前にご一読ください
        </p>
        <q-checkbox v-model="isAgree" label="ServerStarterの利用規約に同意する" />
      </q-card-section>

      <q-card-actions align="right">
        <SsBtn
          color="primary"
          :disable="!isAgree"
          @click="onDialogOK"
        >
          <q-avatar square class="q-mr-md q-my-sm" size="1.3rem">
            <q-icon :name="assets.svg.systemLogo_filled(getCssVar('primary')?.replace('#', '%23'))" />
          </q-avatar>
          <span style="font-size: .8rem;">スタート！</span>
        </SsBtn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<style scoped lang="scss">
h1 {
  margin-top: 0;
  padding: 0;
}
</style>