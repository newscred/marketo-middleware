import pino from 'pino';

const destination =
  process.env.LOG_HANDLER === 'file'
    ? pino.destination(
        `/var/log/marketo-middleware/app-${process.env.APP_ID}.log`
      )
    : pino.destination(1); // STDOUT

const pinoLogger = pino(
  {
    name: process.env.APP_ID,
    level: process.env.LOG_LEVEL || 'info',
  },
  destination
);

process.on(
  'uncaughtException',
  (err) => {
    pinoLogger.error(err, 'uncaughtException');
    process.exit(1); // eslint-disable-line no-process-exit
  }
);

process.on(
  'unhandledRejection',
  (err) => {
    pinoLogger.error(err, 'unhandledRejection');
    process.exit(1); // eslint-disable-line no-process-exit
  }
);

// Reopen the destination after logrotate does it's magic!
process.on('SIGUSR2', () => destination.reopen());

export const appLogger = pinoLogger.child({ logger: 'app' });

export default pinoLogger;