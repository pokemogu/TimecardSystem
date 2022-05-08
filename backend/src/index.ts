import path from 'path';
import fs from 'fs';

import express from 'express';
import type { ErrorRequestHandler } from 'express';
import bearerToken from 'express-bearer-token';
import createHttpError from 'http-errors';
import detectTSNode from 'detect-ts-node';

import { Knex } from 'knex';
import knexConnect from 'knex';

import { Worker } from 'worker_threads';
import dotenv from 'dotenv';

import getLogger from './logger';
import registerHandlers from './webapp';
import { DatabaseAccess } from './dataaccess';

dotenv.config({
  path: process.env.NODE_ENV
    ? (fs.existsSync(path.join('.', '.env.') + process.env.NODE_ENV) ? (path.join('.', '.env.') + process.env.NODE_ENV) : path.join('.', '.env'))
    : path.join('.', '.env')
});
const logger = getLogger('timecard');

// データベースアクセス設定
const knexconfig: Knex.Config<Record<string, any>[]> = {
  client: process.env.DB_TYPE || 'sqlite3',
};

if (knexconfig.client === 'sqlite3') {
  knexconfig.connection = { filename: process.env.DB_NAME || './my_db.sqlite' };
}
else {
  knexconfig.connection = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    database: process.env.DB_NAME || "my_db",
    user: process.env.DB_USER || "my_user",
    password: process.env.DB_PASSWORD || "P@ssw0rd",
    charset: 'utf8mb4'
  };
  knexconfig.pool = {
    min: 2,
    max: 10
  };
}

// ts-node配下で動作している場合はworker_thread(worker_wrapper.js)で特殊な処理が必要となるため
// ts-node配下で動作しているかどうか検知が必要となる。
// detect-ts-nodeパッケージで検知する。
//
// なおts-node-dev配下で動作している場合はデフォルトでTS_NODE_DEVという環境変数がセットされるので
// このような検知処理は不要
if (detectTSNode) {
  process.env.TS_NODE = 'true';
}

function execWorker() {

  const worker = new Worker(path.join(__dirname, './worker_wrapper.js'), {
    workerData: knexconfig,
    // ts-node-devではWorker threadがそのままでは正常に起動しない問題への対処
    // worker側tsファイルは自動トランスパイルされないので注意
    execArgv: process.env.TS_NODE_DEV ? [] : undefined
  });
  worker.on('exit', (exitCode) => {
    logger.warn(`[バックグラウンド処理警告] バックグラウンド処理スレッドが終了しました。終了コードは${exitCode}です。再起動します。`);
    execWorker();
  });
  worker.on('error', (message: any) => {
    logger.warn(`[バックグラウンド処理エラー] バックグラウンド処理スレッドでエラーが発生しました。 ${message}`);
  });

  return worker;
};

execWorker();

// KnexでMySQLを使用する際にKnexでのboolean型はMySQLではTINYINT型としてスキーマ作成されるが、
// そのデータをKnexで取得する際にTINYINT型からboolean型に自動的に変換されないので、
// ここで変換定義する。
(knexconfig.connection as any).typeCast = function (field: any, next: any) {
  if (field.type === 'TINY' && field.length === 1) {
    const value = field.string();
    return value ? (value === '1') : null; // 1 = true, 0 = false
  }
  return next();
};

const app = express();

// クライアントからのリクエストJSONにISO日付形式の文字列がある場合は自動的にDate型に変換する
const reISO = /^(?:[+-]\d{6}|\d{4})-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function isoDateStringToDate(key: any, value: any) {
  if (typeof value === 'string') {
    if ((value.length === 24 || value.length === 27) && value.charAt(value.length - 1) === 'Z') {
      if (reISO.exec(value)) {
        return new Date(value);
      }
    }
  }
  return value;
}

app.use(express.json({ reviver: isoDateStringToDate }));

app.use(express.urlencoded({ extended: true }));
app.use(bearerToken());

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const knex = knexConnect<any, Record<string, any>[]>(knexconfig);
registerHandlers(app, knex);

// デフォルトエラーハンドラー
const defaultErrorHanlder: ErrorRequestHandler = (err, req, res, next) => {

  logger.error(
    err.toString() +
      (err.internalMessage ? (' ' + err.internalMessage) : '') +
      (err instanceof Error) ? ('\n' + (err as Error).stack) : ''
  );

  if (err instanceof createHttpError.HttpError) {
    res.status(err.statusCode).send({ message: err.expose ? err.message : '内部サーバーエラーが発生しました。' });
  }
  else {
    res.status(500).send({ message: '内部サーバーエラーが発生しました。' });
  }
};
app.use(defaultErrorHanlder);

const port = process.env.NODE_PORT ? parseInt(process.env.NODE_PORT) : 3000;
const backlog = process.env.NODE_BACKLOG ? parseInt(process.env.NODE_BACKLOG) : 20;
const listenHost = process.env.NODE_HOST || 'localhost';

DatabaseAccess.initCache(knex);
DatabaseAccess.initPrivatePublicKeys(knex)
  .then(function () {

    app.listen(port, listenHost, backlog, () => {
      logger.info(`サービスを開始します。ポート番号${port}で起動しました。`);
    }).on('error', function (err) {
      logger.error('Express JSの開始に失敗しました。' + err.toString());
      process.exit(255);
    });

  })
  .catch(function (err) {
    logger.error('アクセストークン署名用の鍵の初期化処理に失敗しました。' + err.toString());
    process.exit(255);
  });
