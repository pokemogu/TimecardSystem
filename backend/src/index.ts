import path from 'path';
import fs from 'fs';
import express from 'express';
import { Worker } from 'worker_threads';
import dotenv from "dotenv";

import getLogger from './logger';
import registerHandlers from './webapp';

dotenv.config({
  path: process.env.NODE_ENV
    ? (fs.existsSync("./.env." + process.env.NODE_ENV) ? ("./.env." + process.env.NODE_ENV) : "./.env")
    : "./.env"
});
const logger = getLogger('timecard');

const worker = new Worker(path.join(__dirname, './worker_wrapper.js'));
worker.on('exit', () => {
  console.log('WORKER EXITED!!');
});
worker.on('message', (message: any) => {
  console.log('FROM WORKER: ' + message);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  next();
});

app.listen(3010, () => {
  logger.info("Start on port 3000.");
});

registerHandlers(app, logger);
