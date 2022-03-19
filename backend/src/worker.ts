import { isMainThread, parentPort } from 'worker_threads';
import BackgroundProcess from './background';

console.dir(process.env.DB_TYPE);
console.dir(process.env.DB_HOST);
console.dir(process.env.DB_PORT);
console.dir(process.env.DB_ROOT_USER);
console.dir(process.env.DB_ROOT_PASSWORD);
console.dir(process.env.DB_APP_USER);
console.dir(process.env.DB_APP_PASSWORD);
console.dir(process.env.DB_NAME);

const background = new BackgroundProcess(
  process.env.DB_TYPE,
  process.env.DB_HOST,
  parseInt(process.env.DB_PORT),
  process.env.DB_APP_USER,
  process.env.DB_APP_PASSWORD,
  process.env.DB_NAME
);

let i = 0;

const interval = setInterval(function () {

  if (i > 5) {
    clearInterval(interval);
  }
  console.log('WORKER WORKING!!');
  parentPort.postMessage('I AM FINE!!!!!');
  i++;
  background.doJob();

}, 500);
