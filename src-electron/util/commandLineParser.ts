import { errorMessage } from './error/construct';
import { Failable } from './error/failable';

/** コマンドライン引数をパースする */
export function parseCommandLine(commandLine: string): Failable<string[]> {
  if (commandLine.length === 0) {
    return [];
  }
  const match = commandLine.match(/(?:[^\s"]+|"[^"\\]*(?:\\.[^"\\]*)*")+/g);
  if (match !== null) {
    return [...match];
  }
  return errorMessage.value.commandLineArgument({ value: commandLine });
}
