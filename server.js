'use strict';
process.env.TZ = 'UTC';
import './config.js';

import http from 'http';
import { randomUUID } from 'crypto';
import express from 'express';
import PinoHttp from 'pino-http';

import pinoLogger, { appLogger, log, runWithRequestContext } from './logger.js';
import { generatePreview, publishMarketo } from './marketo/index.js';

function catchAll(func, errMsg) {
  return (req, res) => {
    func(req, res).catch(err => {
      log().error({err}, errMsg);
      if (res.headersSent) { return; }
      // The request id lets a caller who saw this 500 find the matching log lines.
      res.status(500).json({message: errMsg, error: err.message, requestId: req.id});
    });
  };
}

// A client-supplied id is only kept when it is a plain token: it is printed
// verbatim inside the log line's brackets, so anything else could forge the
// shape of a line.
const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;

function chooseRequestId(req) {
  const incomingRequestId = req.headers['x-request-id'];
  const isSafe = typeof incomingRequestId === 'string' && SAFE_REQUEST_ID.test(incomingRequestId);
  return isSafe ? incomingRequestId : randomUUID();
}

const app = express();
app.set('port', process.env.SERVER_PORT);

app.use(PinoHttp({
  logger: pinoLogger,
  genReqId: chooseRequestId,
  quietReqLogger: true,
  // pino-http 6.x passes (res, err, req); later majors reorder to (req, res, err).
  customLogLevel: (res, err) => {
    if (err || res.statusCode >= 500) { return 'error'; }
    if (res.statusCode >= 400) { return 'warn'; }
    return 'info';
  },
  // The health check is polled every few seconds and would drown out real traffic.
  autoLogging: { ignore: (req) => req.url === '/_status' },
}));

app.use(express.json({limit: '2mb'}));

// Must come after express.json(): body-parser resumes from a stream event, which
// runs outside any context bound earlier, so the request context would be lost.
// The child is built from pinoLogger rather than req.log because pino-http
// re-children its logger with its own serializers, replacing the one that keeps
// the Authorization header out of logged axios errors.
app.use((req, res, next) => {
  runWithRequestContext({ logger: pinoLogger.child({ reqId: req.id }) }, () => next());
});

function logWebhookPayload(req, res, next) {
  log().debug({ payload: req.body }, 'webhook payload');
  next();
}

app.get('/_status', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.post('/preview/callback', logWebhookPayload, catchAll(generatePreview, 'error responding for preview'));
app.post('/publishing/callback', logWebhookPayload, catchAll(publishMarketo, 'error responding for publishing'));

http.createServer(app).listen(app.get('port'), () => {
  appLogger.info({ port: app.get('port') }, 'server listening');
});
