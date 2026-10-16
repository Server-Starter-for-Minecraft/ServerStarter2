import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { Path } from '../binary/path';
import { isError, isValid } from '../error/error';
import { openFolder } from './shell';

const { openPath } = vi.hoisted(() => ({
  openPath: vi.fn<(path: string) => Promise<string>>(),
}));
vi.mock('electron', () => ({ app: undefined, shell: { openPath } }));

const workDir = new Path(__dirname).child('work', 'shell');

beforeEach(async () => {
  openPath.mockReset();
  openPath.mockResolvedValue('');
  await workDir.emptyDir();
});

afterAll(async () => {
  await workDir.remove();
});

describe('openFolder', () => {
  test('存在するフォルダを開ける', async () => {
    const dir = workDir.child('exists');
    await dir.mkdir();

    const result = await openFolder(dir.path, false);

    expect(isValid(result)).toBe(true);
    expect(openPath).toHaveBeenCalledWith(dir.path);
  });

  test('autocreateがfalseで存在しないフォルダはエラーを返し，開かない', async () => {
    const result = await openFolder(workDir.child('missing').path, false);

    expect(isError(result) && result.key).toBe('data.path.notFound');
    expect(openPath).not.toHaveBeenCalled();
  });

  test('autocreateがtrueで存在しないフォルダは作成してから開く', async () => {
    const dir = workDir.child('created');

    const result = await openFolder(dir.path, true);

    expect(isValid(result)).toBe(true);
    expect(dir.exists()).toBe(true);
    expect(openPath).toHaveBeenCalledWith(dir.path);
  });

  test('フォルダを作成できない場合はrejectせずエラーを返す', async () => {
    // ファイルの下にはフォルダを作成できない
    const file = workDir.child('file.txt');
    await file.writeText('not a directory');

    const result = await openFolder(file.child('sub').path, true);

    expect(isError(result) && result.key).toBe('data.path.creationFailed');
    expect(openPath).not.toHaveBeenCalled();
  });

  test('OSがフォルダを開けなかった場合はエラーを返す', async () => {
    openPath.mockResolvedValue('failed to open');

    const result = await openFolder(workDir.path, false);

    expect(isError(result) && result.key).toBe('data.path.shellError');
  });

  test('フォルダを開く処理で例外が発生してもrejectせずエラーを返す', async () => {
    openPath.mockRejectedValue(new Error('unexpected'));

    const result = await openFolder(workDir.path, false);

    expect(isError(result)).toBe(true);
  });
});
