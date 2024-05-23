import { exec, ExecException } from 'child_process';
import { osPlatform } from './os';

// PCをシャットダウン
export function shutdown() {
  switch (osPlatform) {
    case 'windows-x64':
      return shutdownWindows();
    case 'mac-os':
    case 'mac-os-arm64':
      return shutdownMac();
    case 'debian':
    case 'redhat':
      return shutdownLinux();
  }
}

function promiseProcess(command: string) {
  return new Promise<ExecException | null>((resolve) => {
    exec(command, (error) => {
      resolve(error);
    });
  });
}

function shutdownWindows() {
  return promiseProcess('shutdown /s /t 0');
}

function shutdownMac() {
  return promiseProcess(
    'osascript -e \'tell app "System Events" to shut down\''
  );
}

function shutdownLinux() {
  // Linuxのディストリビューションによって効果ないこともある
  return promiseProcess('systemctl poweroff');
}
