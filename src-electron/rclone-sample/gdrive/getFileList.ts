import { ChildProcess } from 'child_process';

export async function getFileList(lsProcess: ChildProcess) {
  const fileList: string[] = [];
  return new Promise<string[]>((resolve, reject) => {
    lsProcess.stdout?.on('data', (data) => {
      console.log(data.toString());
      const lines = data.toString().split('\n');
      fileList.push(...lines.filter((line) => line.trim() !== ''));
    });

    lsProcess.stderr?.on('data', (data) => {
      console.error('Error reading file list:', data.toString());
      reject(new Error(data.toString()));
    });

    lsProcess.on('close', (code) => {
      if (code === 0) {
        resolve(fileList.sort());
      } else {
        reject(new Error(`ls process exited with code ${code}`));
      }
    });
  });
}
