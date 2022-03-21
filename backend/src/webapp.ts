import type { Express, Request, Response } from 'express';
import { Knex } from "knex";
import * as apiif from 'shared/APIInterfaces';
import { DatabaseAccess } from './dataaccess';

import type { Logger } from './logger';

type User = {
  id: number
  name: string
  email: string
};

const users: User[] = [
  { id: 1, name: "User1", email: "user1@test.local" },
  { id: 2, name: "User2", email: "user2@test.local" },
  { id: 3, name: "User3", email: "user3@test.local" }
];

type UserParams = {
  name: string
};

export default function registerHandlers(app: Express, knexconfig: Knex.Config, logger: Logger) {

  app.get<{ account: string }, apiif.UserInfoResponseBody>('/api/user/:account', (req, res) => {
    if (req.params.account) {
      const user = users.find(user => user.name === req.params.account);
      if (user) {
        res.send();
      }
      else {
        res.status(404);
        res.send();
      }
    }
    else {
      res.status(400);
      res.send();
    }
  });

  app.post<{}, apiif.IssueTokenResponseBody, apiif.IssueTokenRequestBody>('/api/token/issue', async (req, res) => {
    try {
      const access = new DatabaseAccess(knexconfig);
      const token = await access.issueRefreshToken(req.body.account, req.body.password);
      res.send({
        message: 'ok',
        token: token
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error });
    }
  });

  app.post<{}, apiif.AccessTokenResponseBody, apiif.AccessTokenRequestBody>('/api/token/refresh', async (req, res) => {
    try {
      const access = new DatabaseAccess(knexconfig);
      const token = await access.issueAccessToken(req.body.refreshToken);
      res.send({
        message: 'ok',
        token: <apiif.AccessTokenResponseData>{ accessToken: token }
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error });
    }
  });

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.RevokeTokenRequestBody>('/api/token/revoke', async (req, res) => {
    try {
      const access = new DatabaseAccess(knexconfig);
      await access.revokeRefreshToken(null, req.body.refreshToken);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error });
    }
  });

  app.get<{}, apiif.DevicesResponseBody>('/api/devices', async (req, res) => {
    try {
      const access = new DatabaseAccess(knexconfig);
      const devices = await access.getDevices();
      res.send({
        message: 'ok',
        devices: devices
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error });
    }
  });

  app.get<{ type: string }, apiif.ApplyOptionsResponseBody>('/api/options/apply/:type', async (req, res) => {
    if (!req.params.type) {
      res.status(400);
      res.send({ message: 'type not specified' });
      return;
    }
    try {
      const access = new DatabaseAccess(knexconfig);
      const optionTypes = await access.getApplyOptionTypes(req.params.type);
      res.send({
        message: 'ok',
        optionTypes: optionTypes
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error });
    }
  });

}