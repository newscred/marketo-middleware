import { AsyncLocalStorage } from 'async_hooks';
import pino from 'pino';
import { logSettings } from './config.js';

const MAX_BODY_CHARS = 2000;

// Marketo and the SSO service take credentials as query parameters, so a raw
// URL in a log line would carry a live token.
const SECRET_QUERY_PARAMS = ['access_token', 'client_secret', 'client_id'];

// Anything else falls back to info rather than reaching pino: pino throws on an
// unknown level, which would leave the container crash-looping, and a valid but
// undocumented one such as warn would hide the `logger initialised` line the
// README tells users to check.
const SUPPORTED_LOG_LEVELS = ['info', 'debug'];
const logLevel = SUPPORTED_LOG_LEVELS.includes(logSettings.level) ? logSettings.level : 'info';

export function redactURL(rawURL) {
  if (!rawURL) { return rawURL; }
  try {
    const parsedURL = new URL(rawURL);
    SECRET_QUERY_PARAMS.forEach((paramName) => {
      if (parsedURL.searchParams.has(paramName)) {
        parsedURL.searchParams.set(paramName, 'REDACTED');
      }
    });
    return parsedURL.toString();
  } catch (err) {
    return rawURL;
  }
}

export function truncateBody(body) {
  if (body === undefined || body === null) { return undefined; }
  let bodyText;
  try {
    bodyText = typeof body === 'string' ? body : JSON.stringify(body);
  } catch (err) {
    return '[unserializable body]';
  }
  if (bodyText === undefined || bodyText.length <= MAX_BODY_CHARS) { return bodyText; }
  return `${bodyText.slice(0, MAX_BODY_CHARS)} [truncated ${bodyText.length - MAX_BODY_CHARS} chars]`;
}

// An axios error carries its whole request config, including the Authorization
// header and any credential query parameters. Keep only what helps debugging.
function serializeError(err) {
  if (!err || !err.isAxiosError) {
    return pino.stdSerializers.err(err);
  }
  return {
    type: 'AxiosError',
    message: err.message,
    code: err.code,
    method: err.config?.method?.toUpperCase(),
    url: redactURL(err.config?.url),
    status: err.response?.status,
    responseBody: truncateBody(err.response?.data),
    stack: err.stack,
  };
}

const TEXT_LINE_OMITTED_FIELDS = new Set(['time', 'level', 'message', 'reqId', 'pid', 'hostname', 'name']);

function toTextLine(jsonLine) {
  let entry;
  try {
    entry = JSON.parse(jsonLine);
  } catch (err) {
    return jsonLine;
  }
  const remainingFields = {};
  Object.keys(entry).forEach((key) => {
    if (!TEXT_LINE_OMITTED_FIELDS.has(key)) { remainingFields[key] = entry[key]; }
  });
  const timestamp = new Date(entry.time || Date.now()).toISOString();
  const level = String(entry.level || 'info').toUpperCase();
  const requestId = entry.reqId ? ` [${entry.reqId}]` : '';
  const fields = Object.keys(remainingFields).length ? ` ${JSON.stringify(remainingFields)}` : '';
  return `${timestamp} ${level}${requestId} ${entry.message || ''}${fields}\n`;
}

// Synchronous so a line is never lost when the platform freezes the instance
// right after the response is sent.
const rawStdout = pino.destination({ dest: 1, sync: true });
// The CMP Application Logs viewer only shows plain-text lines; JSON lines are
// stored as structured entries that it never displays.
const stdoutDestination = { write: (chunk) => rawStdout.write(toTextLine(chunk)) };

const logFilePath = `/var/log/marketo-middleware/app-${process.env.APP_ID}.log`;
const fileDestination = logSettings.fileHandler ? pino.destination(logFilePath) : null;

// LOG_HANDLER=file used to replace stdout, and stdout is the only stream the
// hosting platform collects. The file is now an extra copy, never the only one.
// Each stream needs an explicit level: multistream otherwise defaults to 'info'
// and drops debug lines whatever LOG_LEVEL says.
const destination = fileDestination
  ? pino.multistream([
      { level: 'trace', stream: stdoutDestination },
      { level: 'trace', stream: fileDestination },
    ])
  : stdoutDestination;

const pinoLogger = pino(
  {
    name: process.env.APP_ID,
    level: logLevel,
    messageKey: 'message',
    formatters: {
      level: (label) => ({ level: label }),
    },
    serializers: {
      err: serializeError,
      error: serializeError,
    },
    redact: {
      censor: '[redacted]',
      paths: [
        'clientSecret',
        '*.clientSecret',
        'req.headers.authorization',
        'req.headers["callback-secret"]',
        'req.headers.cookie',
        'headers.authorization',
        'headers.Authorization',
        '*.headers.authorization',
        '*.headers.Authorization',
      ],
    },
  },
  destination
);

process.on(
  'uncaughtException',
  (err) => {
    pinoLogger.fatal({ err }, 'uncaughtException');
    process.exit(1); // eslint-disable-line no-process-exit
  }
);

process.on(
  'unhandledRejection',
  (err) => {
    pinoLogger.fatal({ err }, 'unhandledRejection');
    process.exit(1); // eslint-disable-line no-process-exit
  }
);

// Reopen the file after logrotate does its magic!
process.on('SIGUSR2', () => fileDestination?.reopen());

export const appLogger = pinoLogger.child({ logger: 'app' });

// Lets any module log with the current request's id attached, without passing
// a logger through every call.
const requestContext = new AsyncLocalStorage();

export function runWithRequestContext(context, callback) {
  return requestContext.run(context, callback);
}

export function log() {
  return requestContext.getStore()?.logger ?? appLogger;
}

appLogger.info(
  {
    logLevel: pinoLogger.level,
    ...(logLevel !== logSettings.level && { unknownLogLevelIgnored: logSettings.level }),
    logDestination: fileDestination ? `stdout + ${logFilePath}` : 'stdout',
  },
  'logger initialised'
);

export default pinoLogger;
