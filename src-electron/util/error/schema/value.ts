import { ErrorMessageContent } from './base';

// 文字列等の値に関するエラー
export type ValueErrors = {
  playerName: ErrorMessageContent<{ value: string }>;
  playerUUID: ErrorMessageContent<{ value: string }>;
  playerNameOrUUID: ErrorMessageContent<{ value: string }>;
  base64URI: ErrorMessageContent<{ value: string }>;
  commandLineArgument: ErrorMessageContent<{ value: string }>;
  worldName: {
    notMatchRegex: ErrorMessageContent<{ value: string }>;
    alreadyUsed: ErrorMessageContent<{ value: string }>;
  };
  remoteWorldName: {
    notMatchRegex: ErrorMessageContent<{ value: string }>;
    alreadyUsed: ErrorMessageContent<{ value: string }>;
  };
};
