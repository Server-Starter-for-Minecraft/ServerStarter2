// import { runCommand, runServer } from './server';
// import { mainPath } from '../const';
// import { setupDummyIPC } from 'src-electron/ipc/setup_dummy';
// import { VanillaVersion } from 'src-electron/schema/version';

// setupDummyIPC();

describe('vanillaVersion', async () => {
  test(
    '',
    async () => {
      expect(1).toBe(1);

      // const versions = await vanillaVersionLoader.getAllVersions(true);
      // if (isFailure(versions)) return;

      // const index = await findFirstFalse(versions, unlessEula);
      // console.log(index, versions[index]);
    },
    { timeout: 2 ** 31 - 1 }
  );
});

// async function findFirstFalse(
//   dataarray: VanillaVersion[],
//   checkData: (data: VanillaVersion) => Promise<boolean>
// ): Promise<number> {
//   let left = 0;
//   let right = dataarray.length - 1;
//   while (left <= right) {
//     const mid = Math.floor((left + right) / 2);
//     if (await checkData(dataarray[mid])) {
//       left = mid + 1;
//     } else {
//       right = mid - 1;
//     }
//   }
//   return left;
// }

// async function unlessEula(data: VanillaVersion): Promise<boolean> {
//   const eula = mainPath.child(`test/${data.id}/eula.txt`);
//   await eula.remove();

//   const running = runServer({
//     additional: {},
//     container: mainPath.child('test').str(),
//     name: data.id,
//     version: data,
//   });
//   await runCommand('stop');
//   await running;

//   const result = eula.exists();
//   console.log(data, result);

//   return result;
// }
