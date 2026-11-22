// @ts-check
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import { enclosingFunctionNames, projectFilename } from './scope.js';

/**
 * lint のルールの例外（違反を報告しない範囲）を，ファイルの中の範囲に絞って適用する仕組み
 *
 * 標準のルール（`@typescript-eslint/consistent-type-assertions` など）は関数単位で無効にする設定を持たないため，
 * ルールを包んで報告を受け取り，報告された位置が例外の範囲にあれば報告しない。
 * 独自ルールも同じ仕組みで例外を扱い，例外の範囲の判定と「使われていない例外」の検出を 1 か所にまとめる
 */

/** @typedef {import('@typescript-eslint/utils').TSESTree.Node} Node */
/** @typedef {import('@typescript-eslint/utils').TSESLint.RuleModule<string, unknown[]>} RuleModule */

/**
 * ファイルの中の範囲を絞った例外
 *
 * `functions`・`topLevel`・`modules` のいずれか（複数可）で範囲を指定する。
 * いずれも指定しない例外は何も許可しない（ファイル全体を許可する指定は設けない）
 *
 * @typedef {object} ScopedException
 * @property {string} file 対象のファイル（リポジトリのルートからのパス）
 * @property {string[]} [functions] 許可する関数・メソッドの名前（その中で報告された違反を許可する）
 * @property {boolean} [topLevel] モジュールの読み込み時に実行する処理（どの関数の中にもない処理）を許可する
 * @property {string[]} [modules] import を許可するモジュール（`node:` の有無によらず同じモジュールとして扱う）
 * @property {string} reason 許可する理由
 */

/**
 * 例外の一覧と，その例外を適用するルール
 *
 * @typedef {object} ExceptionGroup
 * @property {string[]} rules 例外を適用するルール（`プラグイン名/ルール名`）
 * @property {ScopedException[]} exceptions 例外の一覧
 */

/**
 * 例外によって報告を取りやめたこと（例外が使われたこと）の記録
 *
 * @typedef {object} ExceptionUse
 * @property {string} ruleId 違反を報告したルール
 * @property {ScopedException} exception 使われた例外
 * @property {ExceptionScope} scope 違反を許可した範囲
 */

/**
 * 例外の範囲の 1 つ（関数 1 つ・モジュール 1 つ・モジュールの読み込み時）
 *
 * @typedef {{ kind: 'function' | 'module'; name: string } | { kind: 'topLevel' }} ExceptionScope
 */

/**
 * 例外に指定した範囲を，1 つずつに分けて返す（範囲ごとに使われているかを確かめるために使う）
 *
 * @param {ScopedException} exception 例外
 * @returns {ExceptionScope[]} 例外の範囲の一覧
 */
export function exceptionScopes(exception) {
  return [
    ...(exception.modules ?? []).map(
      (name) => /** @type {ExceptionScope} */ ({ kind: 'module', name })
    ),
    ...(exception.functions ?? []).map(
      (name) => /** @type {ExceptionScope} */ ({ kind: 'function', name })
    ),
    ...(exception.topLevel === true
      ? [/** @type {ExceptionScope} */ ({ kind: 'topLevel' })]
      : []),
  ];
}

/**
 * 例外の範囲を，比較できる文字列にする
 *
 * @param {ExceptionScope} scope 例外の範囲
 * @returns {string} 範囲を表す文字列（`function:名前`・`module:名前`・`topLevel`）
 */
export function scopeKey(scope) {
  return scope.kind === 'topLevel' ? 'topLevel' : `${scope.kind}:${scope.name}`;
}

/** 関数の境界になるノード（この中の処理は，関数を呼んだときに実行される） */
const FUNCTION_TYPES = new Set([
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
  AST_NODE_TYPES.ArrowFunctionExpression,
]);

/**
 * ノードが，モジュールの読み込み時に実行される位置（どの関数の中にもない位置）にあるか
 *
 * 関数の中のほか，インスタンスを作るときに実行されるクラスのフィールドの初期値も対象外とする
 * （計算されたフィールド名（`[makeKey()] = 0` の `makeKey()`）は，クラスを定義するときに実行されるため対象とする）。
 * 同期で呼ばれるコールバック（`forEach` など）も関数として扱う（呼ばれる時期を構文から判定できないため）。
 * モジュールの読み込み時の処理として許可する場合は，コールバックではなくループで書く
 *
 * @param {Node} node 判定するノード
 * @returns {boolean} モジュールの読み込み時に実行される位置であれば true
 */
export function isAtTopLevel(node) {
  /** @type {Node} */
  let child = node;
  for (let current = node.parent; current != null; current = current.parent) {
    if (FUNCTION_TYPES.has(current.type)) return false;
    if (
      (current.type === AST_NODE_TYPES.PropertyDefinition ||
        current.type === AST_NODE_TYPES.AccessorProperty) &&
      !current.static &&
      current.value === child
    ) {
      return false;
    }
    child = current;
  }
  return true;
}

/**
 * ノード（またはそれを含む import・export の文）が読み込むモジュールの指定を返す
 *
 * @param {Node} node 判定するノード
 * @returns {string | undefined} モジュールの指定（import・export の文の中でなければ undefined）
 */
function importedModule(node) {
  /** @type {Node | undefined} */
  let current = node;
  for (; current != null; current = current.parent) {
    switch (current.type) {
      case AST_NODE_TYPES.ImportDeclaration:
      case AST_NODE_TYPES.ExportAllDeclaration:
        return current.source.value;
      case AST_NODE_TYPES.ExportNamedDeclaration:
        return current.source?.value;
      case AST_NODE_TYPES.ImportExpression:
        return current.source.type === AST_NODE_TYPES.Literal &&
          typeof current.source.value === 'string'
          ? current.source.value
          : undefined;
      case AST_NODE_TYPES.TSImportEqualsDeclaration:
        return current.moduleReference.type ===
          AST_NODE_TYPES.TSExternalModuleReference
          ? current.moduleReference.expression.value
          : undefined;
      default:
        break;
    }
  }
  return undefined;
}

/**
 * モジュールの指定から `node:` の接頭辞を除く（組み込みモジュールは接頭辞の有無によらず同じモジュールとする）
 *
 * @param {string} specifier モジュールの指定
 * @returns {string} 接頭辞を除いたモジュールの指定
 */
function withoutNodePrefix(specifier) {
  return specifier.replace(/^node:/, '');
}

/**
 * ノードが例外の範囲の 1 つに含まれるか
 *
 * @param {Node} node 報告されたノード
 * @param {ExceptionScope} scope 判定する範囲
 * @returns {boolean} 範囲に含まれれば true
 */
function isInScope(node, scope) {
  switch (scope.kind) {
    case 'module': {
      const specifier = importedModule(node);
      return (
        specifier !== undefined &&
        withoutNodePrefix(specifier) === withoutNodePrefix(scope.name)
      );
    }
    case 'function':
      return enclosingFunctionNames(node).includes(scope.name);
    case 'topLevel':
      return isAtTopLevel(node);
  }
}

/**
 * ノードが例外の範囲にあれば，違反を許可した範囲を返す
 *
 * 範囲が重なる場合は，狭い範囲（モジュール → 関数 → モジュールの読み込み時）を優先する
 * （import の文はモジュールの読み込み時の位置にもあるため）
 *
 * @param {Node} node 報告されたノード
 * @param {ScopedException} exception 判定する例外（対象のファイルは呼び出し側で確認する）
 * @returns {ExceptionScope | undefined} 違反を許可した範囲（範囲の外であれば undefined）
 */
export function matchException(node, exception) {
  return exceptionScopes(exception).find((scope) => isInScope(node, scope));
}

/**
 * 報告の内容から，報告されたノードを返す
 *
 * 報告は位置（loc）に表示されるため，位置があれば位置を含む最も内側のノードを使う
 * （ファイル全体のノードに対して関数の中の位置を報告するルールでも，表示される位置で範囲を判定する）
 *
 * @param {import('@typescript-eslint/utils').TSESLint.SourceCode} sourceCode 検査しているソースコード
 * @param {import('@typescript-eslint/utils').TSESLint.ReportDescriptor<string>} descriptor 報告の内容
 * @returns {Node | null} 報告されたノード（特定できなければ null）
 */
function reportedNode(sourceCode, descriptor) {
  if ('loc' in descriptor && descriptor.loc != null) {
    const { loc } = descriptor;
    const position = 'start' in loc ? loc.start : loc;
    return sourceCode.getNodeByRangeIndex(sourceCode.getIndexFromLoc(position));
  }
  if ('node' in descriptor && descriptor.node != null) {
    return /** @type {Node} */ (descriptor.node);
  }
  return null;
}

/**
 * ルールを包み，例外の範囲で報告された違反を報告しないルールを作る
 *
 * ルールの名前・設定（schema）・メッセージは元のルールのまま変えない。
 * 例外を適用するのは報告をオブジェクトで渡す形（`context.report({ node, ... })`）のみで，
 * 引数を並べる古い形の報告は，範囲を判定せずにそのまま報告する（例外の範囲を広げる方向には倒さない）
 *
 * @param {RuleModule} rule 元のルール
 * @param {ScopedException[]} exceptions 適用する例外
 * @param {object} [options] 設定
 * @param {string} [options.ruleId] ルールの名前（例外が使われたことの記録に使う）
 * @param {(use: ExceptionUse) => void} [options.onUsed] 例外によって報告を取りやめたときに呼ぶ関数（例外が使われていることの検査に使う）
 * @returns {RuleModule} 例外を適用したルール
 */
export function withExceptions(rule, exceptions, { ruleId = '', onUsed } = {}) {
  return {
    ...rule,
    create(context) {
      const file = projectFilename(context);
      const targets = exceptions.filter((e) => e.file === file);
      if (targets.length === 0) return rule.create(context);

      const { sourceCode } = context;
      /** @type {typeof context.report} */
      const report = (...args) => {
        const [descriptor] = args;
        const node =
          args.length === 1 && typeof descriptor === 'object'
            ? reportedNode(sourceCode, descriptor)
            : null;
        if (node !== null) {
          for (const exception of targets) {
            const scope = matchException(node, exception);
            if (scope !== undefined) {
              onUsed?.({ ruleId, exception, scope });
              return;
            }
          }
        }
        context.report(...args);
      };
      // ルールのコンテキストは書き換えられないため，報告の関数だけを差し替えたコンテキストを作る
      return rule.create(Object.create(context, { report: { value: report } }));
    },
  };
}

/**
 * ルールの名前（`プラグイン名/ルール名`）をプラグイン名とルール名に分ける
 *
 * プラグイン名に `/` を含む場合（`@typescript-eslint/xxx`）があるため，最後の `/` で分ける
 *
 * @param {string} ruleId ルールの名前
 * @returns {[string, string]} プラグイン名とルール名
 */
function splitRuleId(ruleId) {
  const index = ruleId.lastIndexOf('/');
  if (index < 0) {
    throw new Error(
      `例外はプラグインのルールにのみ適用できます（標準のルールは serverstarter プラグインで包んで使ってください）: ${ruleId}`
    );
  }
  return [ruleId.slice(0, index), ruleId.slice(index + 1)];
}

/**
 * 設定の一覧に含まれるプラグインのルールに，例外を適用する
 *
 * ルールの名前を変えずに例外を適用するため，プラグインを例外を適用したルールに差し替えたものに置き換える
 * （同じ名前のプラグインに別のものを指定すると ESLint がエラーにするため，すべての設定で置き換える）
 *
 * @template {{ plugins?: Record<string, any> }} C
 * @param {C[]} configs ESLint の設定の一覧
 * @param {ExceptionGroup[]} groups 適用する例外
 * @param {(use: ExceptionUse) => void} [onUsed] 例外によって報告を取りやめたときに呼ぶ関数
 * @returns {C[]} プラグインを置き換えた設定の一覧
 */
export function applyExceptions(configs, groups, onUsed) {
  /** @type {Map<string, ScopedException[]>} */
  const exceptionsByRule = new Map();
  for (const { rules, exceptions } of groups) {
    for (const ruleId of rules) {
      exceptionsByRule.set(ruleId, [
        ...(exceptionsByRule.get(ruleId) ?? []),
        ...exceptions,
      ]);
    }
  }

  /** 置き換え後のプラグイン（プラグイン名ごと） */
  /** @type {Map<string, any>} */
  const patched = new Map();
  for (const ruleId of exceptionsByRule.keys()) {
    const [pluginName] = splitRuleId(ruleId);
    if (patched.has(pluginName)) continue;
    const plugin = configs.find((c) => c.plugins?.[pluginName])?.plugins?.[
      pluginName
    ];
    if (plugin === undefined) {
      throw new Error(`プラグインが見つかりません: ${pluginName}`);
    }
    patched.set(pluginName, { ...plugin, rules: { ...plugin.rules } });
  }
  for (const [ruleId, exceptions] of exceptionsByRule) {
    const [pluginName, ruleName] = splitRuleId(ruleId);
    const plugin = patched.get(pluginName);
    const rule = plugin.rules[ruleName];
    if (rule === undefined) {
      throw new Error(`ルールが見つかりません: ${ruleId}`);
    }
    plugin.rules[ruleName] = withExceptions(rule, exceptions, {
      ruleId,
      onUsed,
    });
  }

  return configs.map((config) => {
    if (config.plugins === undefined) return config;
    const names = Object.keys(config.plugins).filter((name) =>
      patched.has(name)
    );
    if (names.length === 0) return config;
    return {
      ...config,
      plugins: {
        ...config.plugins,
        ...Object.fromEntries(names.map((name) => [name, patched.get(name)])),
      },
    };
  });
}
