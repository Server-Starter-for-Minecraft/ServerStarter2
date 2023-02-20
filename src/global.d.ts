declare global {
  interface Window {
      API: IMainProcess;
  }
}

export interface IMainProcess {
  test: () => Promise<string>;
}