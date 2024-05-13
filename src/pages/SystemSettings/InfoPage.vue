<script setup lang="ts">
import { useSystemStore } from 'src/stores/SystemStore';
import SsBtn from 'src/components/util/base/ssBtn.vue';
import CreaterItem from 'src/components/SystemSettings/Info/CreaterItem.vue';
import SsA from 'src/components/util/base/ssA.vue';

const sysStore = useSystemStore();

// TODO: 本来はこのオプションをバックエンドから取得する
// ひとまずは手動でアップデートをすることは想定しないため、true固定
// v2.0.0では，強制的に最新のバージョンへアップデートするため，手動でのバージョン更新は起きない
const latest = true;
const lastUpdateDateTime = sysStore.systemSettings.system.lastUpdatedTime;

// TODO: installerのダウンロードなどを行い、システムをアップデートするための準備を行う
function systemUpdate() {}

/**
 * システムログフォルダを開く
 */
function openLog() {
  window.API.sendOpenFolder(sysStore.staticResouces.paths.log, true);
}

/**
 * MIT LICENSEのファイルを開く
 */
function openMIT() {
  window.API.sendOpenBrowser(
    'https://github.com/CivilTT/ServerStarter2/blob/master/LICENSE'
  );
}
</script>

<template>
  <div class="vertical-scroll">
    <div class="q-px-md" style="margin: auto; width: fit-content">
      <h1 class="q-pt-md">{{ $t('systemsetting.info.systemVersion') }}</h1>
      <div class="q-pl-md">
        <!-- バージョン名 -->
        <div class="row items-center">
          <p class="q-ma-none">{{ sysStore.systemVersion }}</p>
          <div class="q-ml-md">
            <p v-if="latest" class="q-ma-none">
              {{ $t('systemsetting.info.latest') }}
            </p>
            <SsBtn
              v-else
              free-width
              :label="$t('systemsetting.info.update')"
              color="primary"
              @click="systemUpdate"
            />
          </div>
        </div>

        <!-- 最終更新日 -->
        <div
          v-if="lastUpdateDateTime"
          class="text-caption q-pt-sm"
          style="opacity: 0.6"
        >
          {{
            $t('systemsetting.info.finalUpdate', {
              datetime: $d(lastUpdateDateTime, 'dateTime'),
            })
          }}
        </div>
      </div>

      <h1>{{ $t('systemsetting.info.systemLog') }}</h1>
      <div class="q-pl-md">
        <div class="text-caption" style="opacity: 0.6">
          {{ $t('systemsetting.info.systemLogDesc') }}
        </div>
        <SsBtn
          :label="$t('systemsetting.info.openSystemLog')"
          @click="openLog"
          class="q-mt-md"
        />
      </div>

      <h1>{{ $t('systemsetting.info.externalLink') }}</h1>
      <div class="q-pl-md q-py-sm q-gutter-sm">
        <div class="row">
          <p class="q-ma-none" style="width: 12rem">
            {{ $t('systemsetting.info.homepage') }}
          </p>
          <SsA
            url="https://server-starter-for-minecraft.github.io"
            class="text-body2"
            style="width: 20rem"
          >
            https://server-starter-for-minecraft.github.io
          </SsA>
        </div>
        <div class="row q-pt-sm">
          <p class="q-ma-none" style="width: 12rem">
            {{ $t('systemsetting.info.contact') }}
          </p>
          <div class="row" style="width: 20rem">
            <SsA url="https://twitter.com/CivilT_T" class="text-body2">
              https://twitter.com/CivilT_T
            </SsA>
            <span>{{ $t('systemsetting.info.dm') }}</span>
          </div>
        </div>
      </div>

      <h1>{{ $t('systemsetting.info.license') }}</h1>
      <div class="q-pl-md">
        <div class="row items-start">
          <p class="q-ma-none">{{ $t('systemsetting.info.MIT') }}</p>
          <q-btn
            flat
            dense
            icon="open_in_new"
            color="grey"
            size=".5rem"
            @click="openMIT"
          />
        </div>
        <div
          class="text-caption q-pt-sm"
          style="opacity: 0.6; white-space: pre-line;" 
        >
          {{ $t('systemsetting.info.licenseDesc') }}
        </div>
      </div>

      <h1>{{ $t('systemsetting.info.developer') }}</h1>
      <div class="q-pl-md">
        <CreaterItem
          :job="$t('systemsetting.info.productionManager')"
          :names="['CivilTT']"
          url="https://twitter.com/CivilT_T"
        />
        <CreaterItem
          :job="$t('systemsetting.info.technicalManager')"
          :names="['txkodo']"
          url="https://twitter.com/txkodo"
        />
        <CreaterItem
          :job="$t('systemsetting.info.support')"
          :names="['nozz']"
        />
      </div>
    </div>
  </div>
</template>
