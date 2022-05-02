const path = require('path');

const { isMainThread, workerData } = require('worker_threads');

if (!isMainThread) {
  // ts-nodeまたはts-node-dev配下でworker threadを動作させる場合は
  // 直接.tsファイルをworkerとして動作させることができないので、
  // 本ファイルの様なラッパーjsファイルを作成し、以下のように.tsファイルを呼び出す。
  if (process.env.TS_NODE || process.env.TS_NODE_DEV) {
    require('ts-node').register();
    const worker = require(path.join(__dirname, 'worker.ts')).worker;
    worker(workerData);
  }
  else {
    const worker = require(path.join(__dirname, 'worker.js')).worker;
    worker(workerData);
  }
}
