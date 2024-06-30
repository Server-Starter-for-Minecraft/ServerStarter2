import { SystemSettings } from 'app/src-electron/schema/system';

/**
 * バックエンドからわたってきたSystemSettingsをフロント用に変換するための変換器
 */
export abstract class Converter<FrontT, BackT> {
  /** フロント用のStoreにデータを注入 */
  abstract setSysStore(sys: SystemSettings): void;
  /** バックエンドSystemSettings -> フロントエンドデータ */
  protected abstract toFront(sys: BackT): FrontT;
  /** フロントエンドデータ -> バックエンドSystemSettings */
  protected abstract fromFront(sys: FrontT): BackT;
  /** フロント用のStoreをバックのSystemSettingsに戻す */
  abstract setSysSettings(sys: SystemSettings): SystemSettings;
}
