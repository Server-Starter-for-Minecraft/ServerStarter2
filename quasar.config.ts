// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-file
import { defineConfig } from '#q-app';
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export default defineConfig((ctx) => {
  const srcDir = process.env.SRC_DIR || 'src';

  return {
    // app boot file (/src/boot)
    // --> boot files are part of "main.js"
    // https://v2.quasar.dev/quasar-cli-vite/boot-files
    boot: ['i18n'],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#css
    css: ['app.scss'],

    // https://github.com/quasarframework/quasar/tree/dev/extras
    extras: ['roboto-font', 'material-icons'],

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#build
    build: {
      target: {
        browser: ['chrome140'],
        node: 'node24',
      },

      typescript: {
        strict: false,
        vueShim: true,
      },

      vueRouterMode: 'hash', // available values: 'hash', 'history'

      // 旧来の`app/`・`src/`・`src-electron/`エイリアスを維持する
      alias: {
        app: ctx.appPaths.appDir,
        src: ctx.appPaths.srcDir,
        'src-electron': ctx.appPaths.electronDir,
      },

      define: {
        'import.meta.vitest': 'undefined',
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
      },

      vitePlugins: [
        [
          '@intlify/unplugin-vue-i18n/vite',
          {
            // if you want to use Vue I18n Legacy API, you need to set `compositionOnly: false`
            // compositionOnly: false,
            runtimeOnly: false,

            // you need to set i18n resource including paths !
            include: [ctx.appPaths.resolve.src('i18n/**/*.json')],
          },
        ],
      ],
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#framework
    framework: {
      config: {},

      // Quasar plugins
      plugins: ['Dialog'],
    },

    // https://v2.quasar.dev/options/animations
    animations: [],

    // https://v2.quasar.dev/quasar-cli-vite/quasar-config-file#sourcefiles
    sourceFiles: {
      rootComponent: `${srcDir}/App.vue`,
      router: `${srcDir}/router/index`,
    },

    // Full list of options: https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/configuring-electron
    electron: {
      inspectPort: 5858,

      bundler: 'builder', // 'packager' or 'builder'

      /** パッケージング前にvcruntime140.dllをngrokフォルダにコピーする */
      beforePackaging({ unpackagedDir }) {
        const srcPath = ctx.appPaths.resolve.app('include/vcruntime140.dll');

        const dirs = [
          'node_modules/@ngrok/ngrok-win32-x64-msvc', //windows
        ];

        for (const dir of dirs) {
          const resolved = join(unpackagedDir, dir);
          if (existsSync(resolved)) {
            copyFileSync(srcPath, join(resolved, 'vcruntime140.dll'));
          }
        }
      },

      builder: {
        // https://www.electron.build/configuration/configuration
        appId: 'ServerStarter2',
        artifactName: 'ServerStarter.build.${ext}',
        asarUnpack: [
          'node_modules/sharp/**',
          'node_modules/@img/**',
          'node_modules/@ngrok/**/*.node',
          'node_modules/@ngrok/**/*.dll',
        ],
        win: {
          target: 'msi',
        },
        mac: {
          target: 'pkg',
        },
        linux: {
          target: ['deb', 'rpm'],
          icon: ctx.appPaths.resolve.electron('electron-assets/icons'),
          category: 'Utility',
        },
      },
    },
  };
});
