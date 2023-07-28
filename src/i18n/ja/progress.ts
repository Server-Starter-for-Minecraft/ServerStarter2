import { ProgressMessageTranslation } from 'app/src-electron/schema/progressMessage';

export const jaProgress: ProgressMessageTranslation = {
  server: {
    preparing: '',
    postProcessing: '',
    getOwner: 'オーナーのデータを取得中です',
    eula: {
      title: 'EULAの同意状況を確認しています',
      generating: 'eula.txt を生成中です',
      loading: 'eula.txt を読み込み中です',
      saving: 'eula.txt に書き込み中です',
      asking: 'eula.txt に同意するかどうかを問い合わせています'
    },
    local: {
      loading: 'ローカルのワールドデータを読み込み中です',
      saving: 'ローカルにワールドデータを反映しています',
      savingSettingFiles: 'ワールド設定ファイルを保存中です',
      formatWorldDirectory: 'ワールドのデータ構造を変更中です',
      reloading: 'ワールドデータを再読み込みしています',
			checkUsing: 'ワールドが使用中かどうか確認しています',
			movingSaveData: 'ワールドのデータを移動中です'
    },
		remote: {
			check: 'リモートのデータがあるかどうか確認しています',
			pull: 'リモートのデータをダウンロード中です',
			push: 'リモートにデータをアップロード中です'
		},
		java: {
			memoryArguments: 'メモリ容量に関する引数を取得しています',
			userArguments: 'ユーザー設定に関する引数を取得しています'
		},
		version: {
			getLog4jSettingFile: 'log4Jの設定ファイルをダウンロード中です'
		},
  },
};
