import { runtimePath } from '../../server/const.js';
import { readyJava } from './java.js';

console.log(await readyJava(runtimePath, 'java-runtime-gamma'));
