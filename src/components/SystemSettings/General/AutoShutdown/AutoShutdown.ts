import { useQuasar } from 'quasar';
import autoshutdownDialog from './AutoShutdownDialog.vue';

let sendRes: ((value: boolean) => void) | undefined = undefined;

export function setShutdownHandler() {
  const $q = useQuasar();

  window.API.handleCheckShutdown(async () => {
    const promise = new Promise<boolean>((resolve) => {
      sendRes = (value: boolean) => {
        sendRes = undefined;
        resolve(value);
      };
    });

    // 確認Dialogの表示
    $q.dialog({
      component: autoshutdownDialog,
    });

    return await promise;
  });
}

/**
 * シャットダウンをするか否かの選択を行い、その選択をバックエンドに伝達する
 */
export function shutdownSelecter(isShutdown: boolean) {
  sendRes?.(isShutdown);
}
