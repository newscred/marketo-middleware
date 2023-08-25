'use strict';
process.env.TZ = 'UTC';
import './config.js';

import http from 'http';
import express from 'express';
import PinoHttp from 'pino-http';

import { appLogger } from './logger.js';
import { generatePreview, publishMarketo } from './marketo/index.js';

function catchAll(func, errMsg) {
  return (req, res) => {
    func(req, res).catch(err => {
      appLogger.error({err}, errMsg);
      res.status(500).json({message: errMsg});
    });
  };
}

const app = express();
app.use(PinoHttp());
app.set('port', process.env.SERVER_PORT);
app.use(express.json({limit: '2mb'}));

app.get('/_status', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.post('/preview/callback', catchAll(generatePreview, 'error responding for preview'));
app.post('/publishing/callback', catchAll(publishMarketo, 'error responding for publishing'));

http.createServer(app).listen(app.get('port'));

process.on('uncaughtException', function (err) {
  appLogger.error({ err }, 'App server - Crashed');
  process.exitCode(1);
  throw err;
});
