const path = require('path');
const { isMainThread, workerData } = require('worker_threads');

if (!isMainThread) {
  if (process.env.NODE_ENV === 'development') {
    require('ts-node').register();
    const worker = require(path.join(__dirname, 'worker.ts')).worker;
    worker(workerData);
  }
  else {
    const worker = require(path.join(__dirname, 'worker.js')).worker;
    worker(workerData);
  }
}
