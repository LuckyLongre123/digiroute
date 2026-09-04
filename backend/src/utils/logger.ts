import pino from 'pino';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFile = path.join(__dirname, '../logs/error.log');
const isDev = process.env.NODE_ENV !== 'production';

const logger = pino(
  {
    level: process.env.LOG_LEVEL ?? 'info',
    base: { pid: process.pid },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  isDev
    ? (pino as unknown as typeof pino & { transport: (opts: object) => unknown }).transport({
        targets: [
          {
            target: 'pino-pretty',
            level: 'debug',
            options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid' },
          },
          {
            target: 'pino/file',
            level: 'error',
            options: { destination: logFile },
          },
        ],
      })
    : pino.transport({
        targets: [
          {
            target: 'pino/file',
            level: 'error',
            options: { destination: logFile },
          },
        ],
      })
);

export default logger;
