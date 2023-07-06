import { osPlatform } from './os';
import { ExecException, exec } from 'child_process';

// PCをシャットダウン
export function shutdown() {
  switch (osPlatform) {
    case 'windows-x64':
      return shutdownWindows();
    case 'mac-os':
    case 'mac-os-arm64':
      return shutdownMac();
    case 'linux':
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
