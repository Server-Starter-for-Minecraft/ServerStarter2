import { MemorySettings } from 'app/src-electron/schema/memory';
import { getSystemSettings } from '../../stores/system';
import { rootLoggerHierarchy } from '../../logger';

export async function getMemoryArguments(memory: MemorySettings | undefined) {
  const defaultMemory = (await getSystemSettings()).world.memory;
  memory ??= defaultMemory;

  let memorystr = '';

  const memorySize = Math.round(memory.size);

  const lowerunit = memory.unit.toLowerCase();

  switch (lowerunit) {
    case 'b':
    case '':
      memorystr = `${memorySize}`;
      break;
    case 'kb':
    case 'k':
      memorystr = `${memorySize}K`;
      break;
    case 'mb':
    case 'm':
      memorystr = `${memorySize}M`;
      break;
    case 'gb':
    case 'g':
      memorystr = `${memorySize}G`;
      break;
    case 'tb':
    case 't':
      memorystr = `${memorySize}T`;
      break;
    default:
      rootLoggerHierarchy.server
        .setMamoryAmount(memory)
        .error(`unknown unit ${memory.unit}`);
      return getMemoryArguments(defaultMemory);
  }

  return [`-Xmx${memorystr}`, `-Xms${memorystr}`];
}
