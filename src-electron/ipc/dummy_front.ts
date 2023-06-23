import { API } from '../api/api';
import { FrontListener } from './link';

export const frontDummyListener: FrontListener<API> = {
  on: {
    StartServer: () => console.log('StartServer'),
    FinishServer: () => console.log('FinishServer'),
    UpdateStatus: (...args) => console.log('UpdateStatus', ...args),
    AddConsole: (...args) => console.log('AddConsole', ...args),
    UpdateSystemSettings: (...args) =>
      console.log('UpdateSystemSettings', ...args),
  },
  handle: {
    AgreeEula: async () => true,
  },
};
