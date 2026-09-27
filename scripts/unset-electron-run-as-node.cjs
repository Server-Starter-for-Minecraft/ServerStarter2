// Electron を Node.js として起動した後に ELECTRON_RUN_AS_NODE を削除する
// (Quasar CLI が起動するアプリ本体の Electron に引き継がれると，アプリが Node.js として起動してしまうため)
delete process.env.ELECTRON_RUN_AS_NODE;
