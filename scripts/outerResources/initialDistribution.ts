import {
  builtInGroupKeys,
  propertyClasses,
} from 'app/src/components/World/Property/classifications';
import { enUSproperty } from 'app/src/i18n/en-US/Pages/World/property';
import { jaProperty } from 'app/src/i18n/ja/Pages/World/property';
import { DonationResourceV1 } from 'app/src-electron/schema/outerResource/donation';
import { ServerPropertiesResourceV1 } from 'app/src-electron/schema/outerResource/serverProperties';
import { DefaultServerPropertiesAnnotation } from 'app/src-electron/schema/serverproperty';
import { distributionPath } from 'app/src-electron/source/outerResource/definition';
import { schemaPath } from 'app/src-electron/source/outerResource/distribution';
import {
  bundledDonation,
  donationDefinition,
} from 'app/src-electron/source/outerResource/resources/donation';
import { serverPropertiesDefinition } from 'app/src-electron/source/outerResource/resources/serverProperties';

/** 配布ファイルの初期データ（配布元でのパスと内容の組。画像も配布元でのパスとバイト列の組） */
export type InitialDistribution = {
  files: Record<string, object>;
  images: Record<string, Buffer>;
};

/**
 * 配布ファイルの初期データを作る（アプリ内の定義を配布ファイルの形にする）
 *
 * - 寄付サービス：同梱の一覧（アイコンは画像ファイルとして書き出す）
 * - サーバープロパティ：アプリ内の定義に，アプリ内の説明文とタブの分類を加えたもの
 *
 * @returns 配布ファイルと画像ファイル
 */
export function buildInitialDistribution(): InitialDistribution {
  const images: Record<string, Buffer> = {};
  const donation: DonationResourceV1 = {
    services: bundledDonation.services.map((service) => {
      const match = service.icon?.match(/^data:image\/png;base64,(.+)$/);
      if (match === undefined || match === null) return service;
      const icon = `icons/${service.id}.png`;
      images[`v${donationDefinition.schemaVersion}/${icon}`] = Buffer.from(
        match[1],
        'base64'
      );
      return { ...service, icon };
    }),
  };

  const groupsOf = (key: string) =>
    builtInGroupKeys.filter((group) => propertyClasses[group].includes(key));
  const groupLabels: Record<string, Record<string, string>> = {
    ja: jaProperty.group,
    'en-US': enUSproperty.group,
  };
  const descriptions: Record<string, Record<string, string>> = {
    ja: jaProperty.description,
    'en-US': enUSproperty.description,
  };

  const serverProperties: ServerPropertiesResourceV1 = {
    groups: builtInGroupKeys.map((id) => ({
      id,
      label: Object.fromEntries(
        Object.entries(groupLabels).map(([locale, labels]) => [
          locale,
          labels[id],
        ])
      ),
    })),
    properties: Object.fromEntries(
      Object.entries(DefaultServerPropertiesAnnotation).map(
        ([key, annotation]) => {
          const description = Object.fromEntries(
            Object.entries(descriptions).flatMap(([locale, texts]) =>
              texts[key] ? [[locale, texts[key]]] : []
            )
          );
          const groups = groupsOf(key);
          return [
            key,
            {
              ...(groups.length > 0 ? { groups } : {}),
              ...(Object.keys(description).length > 0 ? { description } : {}),
              definitions: [annotation],
            },
          ];
        }
      )
    ),
  };

  return {
    files: Object.fromEntries(
      (
        [
          [distributionPath(donationDefinition), donation],
          [distributionPath(serverPropertiesDefinition), serverProperties],
        ] as const
      ).map(([path, content]) => [
        path,
        // 配布ファイルからの相対パスで JSON Schema を参照し，エディタで入力補完と検証を効かせる
        {
          $schema: `./${schemaPath(path).split('/').slice(1).join('/')}`,
          ...content,
        },
      ])
    ),
    images,
  };
}
