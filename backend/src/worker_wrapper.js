const path = require('path');
const { isMainThread } = require('worker_threads');

if (!isMainThread) {
  if (process.env.NODE_ENV === 'development') {
    require('ts-node').register();
    require(path.join(__dirname, 'worker.ts'))
  }
  else {
    require(path.join(__dirname, 'worker.js'))
  }
}
