import { Path } from "app/src-electron/util/path";

const GITIGNORE_PATH = '.gitignore';

const IGNORE_PATHS = [
    '/libralies',
    '/logs',
    '/versions',
    '/eula.txt',
    '/*.jar',
];

/**
 * .gitignoreを作成
 * 現状は固定値
*/
export async function writeGitignore(serverCwdPath: Path) {
    const filePath = serverCwdPath.child(GITIGNORE_PATH)
    await filePath.writeText(
        IGNORE_PATHS.join("\n")
    )
}
