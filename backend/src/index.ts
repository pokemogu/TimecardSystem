import path from 'path';
import fs from 'fs';
import express from 'express';
import { Knex } from 'knex';

import { Worker } from 'worker_threads';
import dotenv from 'dotenv';

import getLogger from './logger';
import registerHandlers from './webapp';

dotenv.config({
  path: process.env.NODE_ENV
    ? (fs.existsSync("./.env." + process.env.NODE_ENV) ? ("./.env." + process.env.NODE_ENV) : "./.env")
    : "./.env"
});
const logger = getLogger('timecard');

// データベースアクセス設定
const knexconfig: Knex.Config = {
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
    user: process.env.DB_APP_USER || "my_user",
    password: process.env.DB_APP_PASSWORD || "P@ssw0rd",
    charset: 'utf8mb4'
  };
  knexconfig.pool = {
    min: 2,
    max: 10
  };
}

function execWorker() {

  const worker = new Worker(path.join(__dirname, './worker_wrapper.js'), {
    workerData: knexconfig,
    // ts-node-devではWorker threadがそのままでは正常に起動しない問題への対処
    // worker側tsファイルは自動トランスパイルされないので注意
    execArgv: []
  });
  worker.on('exit', (exitCode) => {
    logger.warn(`[バックグラウンド処理警告] バックグラウンド処理スレッドが終了しました。終了コードは${exitCode}です。再起動します。`);
    execWorker();
  });
  worker.on('error', (message: any) => {
    logger.warn(`[バックグラウンド処理エラー] バックグラウンド処理スレッドでエラーが発生しました。 ${message}`);
  });

};

execWorker();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

const port = process.env.NODE_PORT || 3010;
app.listen(port, () => {
  logger.info(`サービスを開始します。ポート番号${port}で起動しました。`);
});

registerHandlers(app, knexconfig, logger);
