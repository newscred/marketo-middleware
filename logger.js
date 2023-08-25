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
    level: process.env.LOG_LEVEL,
  },
  destination
);

/*
The finalLogger is a special logger instance that will synchronously and reliably flush every log line.
This is important in exit handlers, since no more asynchronous activity may be scheduled.
*/
process.on(
  'uncaughtException',
  pino.final(pinoLogger, (err, finalLogger) => {
    finalLogger.error(err, 'uncaughtException');
    process.exit(1); // eslint-disable-line no-process-exit
  })
);

process.on(
  'unhandledRejection',
  pino.final(pinoLogger, (err, finalLogger) => {
    finalLogger.error(err, 'unhandledRejection');
    process.exit(1); // eslint-disable-line no-process-exit
  })
);

// Reopen the destination after logrotate does it's magic!
process.on('SIGUSR2', () => destination.reopen());

export const appLogger = pinoLogger.child({ logger: 'app' });

export default pinoLogger;