// ipcで使用するチャンネル名を列挙

/** MainからWindowのイベントを発火するチャンネル名 */
export type SendChannel = 'update-status' | 'add-console';

/** WindowからMainのイベントを発火するチャンネル名 */
export type OnChannel = 'send-command';

/** WindowでMainの処理を非同期で待機するチャンネル名 */
export type HandleChannel = 'RunServer' | 'ReadyServer';

/** MainでWindowの処理を非同期で待機するチャンネル名 */
export type InvokeChannel = 'InvokeEula';
