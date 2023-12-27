
/** サーバー開始時にフロントエンドにわたる情報 */
export type ServerStartNotification = {
    /** Ngrokのurl (Ngrokを使用している場合のみ) */
    ngrokURL?: string
}