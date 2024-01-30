import { ErrorMessageContent } from './base';

type PathErrorContent = ErrorMessageContent<{
  type: 'file' | 'directory';
  path: string;
}>;

// 使用している外部ツールに関するエラー
export type LibErrors = {
  ngrok: {
    /**
     * 予約されていないTCPaddressを使用した場合のエラー
     * https://ngrok.com/docs/tcp/#fixed-address
     *
     * Error: failed to start listener: You must reserve an address for your account before it can be bound.
     * Failed to bind the address 'foo.bar.buz' for the account '{account}' in region 'jp'.
     * (Hint: Did you reserve the address in this region?)
     * Reserve an address on your dashboard: https://dashboard.ngrok.com/cloud-edge/tcp-addresses error_code: ERR_NGROK_307
     */
    unreservedAdress: ErrorMessageContent<{
      adress: string;
    }>;

    /** 対応していないエラーはぜんぶここ */
    unknown: ErrorMessageContent<{
      message: string;
    }>;
  };
};
