/** サーバー開始時にフロントエンドにわたる情報 */
export type ServerStartNotification = {
  /** Ngrokのurl (Ngrokを使用している場合のみ) */
  ngrokURL?: string;
  /**
   * 実際に使用したLANのport番号
   * Ngrokを使用するとプロパティのポートとは異なる番号が使われるため
   */
  port: number;
};
