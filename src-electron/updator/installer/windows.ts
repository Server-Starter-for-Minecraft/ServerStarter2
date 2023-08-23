import { exec } from 'child_process';
import * as https from 'https';
import * as fs from 'fs';
import { BytesData } from 'app/src-electron/util/bytesData';
import { isError } from 'app/src-electron/util/error/error';

const downloadFile = async (url: string, dest: string): Promise<void> => {
  const data = await BytesData.fromURL(url);
  if (isError(data)) {
    console.log(data)
    return
};
  await data.write(dest, true);
};

const installMsi = async (msiPath: string): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    exec(`msiexec /i "${msiPath}" /qn`, (error, stdout, stderr) => {
      if (error) {
        console.log(error);
        reject(error.message);
      } else if (stderr) {
        console.log(stderr);
        reject(stderr);
      } else {
        resolve(stdout);
      }
    });
  });
};

export async function installWindows(msiurl: string) {
  const dest = 'installer.msi';
  try {
    await downloadFile(msiurl, dest);
    await installMsi(dest);
    console.log('Installation successful!');
  } catch (e) {
    console.log('Installation failure...', e);
  }
}
