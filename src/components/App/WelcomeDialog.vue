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

defineEmits({ ...useDialogPluginComponent.emitsObject });
const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } =
  useDialogPluginComponent();

const t = useI18n();
const sysStore = useSystemStore();
const isAgree = ref(false);

const localeOptions: { value: Locale; label: string }[] = [
  { value: 'ja', label: '日本語' },
  { value: 'en-US', label: 'English' },
];

function changeLocale(loc: Locale) {
  t.locale.value = loc;
}
</script>

<template>
  <q-dialog ref="dialogRef" persistent @hide="onDialogHide">
    <q-card flat>
      <q-card-section>
        <div style="font-size: 1.5rem">{{ $t('welcome.welcome') }}</div>
      </q-card-section>

      <q-card-section>
        <h1>{{ $t('welcome.lang') }}</h1>
        <SsSelect
          dense
          v-model="sysStore.systemSettings.user.language"
          @update:model-value="(newVal) => changeLocale(newVal)"
          :options="localeOptions"
          option-label="label"
          option-value="value"
        />
      </q-card-section>

      <q-card-section class="q-mt-md">
        <h1>{{ $t('welcome.term') }}</h1>

        <p class="text-caption" style="opacity: 0.6">
          <i18n-t keypath="welcome.termDesc" tag="false">
            <SsA url="https://civiltt.github.io/ServerStarter/credit">
              {{ $t('welcome.link') }}
            </SsA>
            <br>
          </i18n-t>
        </p>
        <q-checkbox v-model="isAgree" :label="$t('welcome.agreeTerm')" />
      </q-card-section>

      <q-card-actions align="right">
        <SsBtn color="primary" :disable="!isAgree" @click="onDialogOK">
          <q-avatar square class="q-mr-md q-my-sm" size="1.3rem">
            <q-icon
              :name="
                assets.svg.systemLogo_filled(
                  getCssVar('primary')?.replace('#', '%23')
                )
              "
            />
          </q-avatar>
          <span style="font-size: 0.8rem">{{ $t('welcome.start') }}</span>
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
