import type { Express, Request, Response } from 'express';
import { Knex } from "knex";
import knexConnect from 'knex';
import * as apiif from 'shared/APIInterfaces';
import { DatabaseAccess } from './dataaccess';

import type { Logger } from './logger';

function extractTokenFromHeader(header: string) {
  const matches = header.match(/^Bearer ([\w\-]+\.[\w\-]+\.[\w\-]+)$/);
  if (!matches || matches.length < 1) {
    return undefined;
  }
  return matches[1];
}

export default async function registerHandlers(app: Express, knexconfig: Knex.Config, logger: Logger) {

  const knex = knexConnect(knexconfig);
  DatabaseAccess.initCache(knex);
  await DatabaseAccess.initPrivatePublicKeys(knex);

  app.get<{ account: string }, apiif.UserAccountCandidatesResponseBody>('/api/user/account-candidates', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const users = await access.generateAvailableUserAccount();
      const user = users[0];

      res.send({
        message: 'ok',
        candidates: await access.generateAvailableUserAccount()
      });
    } catch (error) {
      const err = error as Error;
      res.status(400);
      res.send({ message: error.message });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連
  ///////////////////////////////////////////////////////////////////////

  app.get<{ account: string }, apiif.UserInfoResponseBody>('/api/user/:account', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const users = await access.getUsers(token, { byAccount: req.params.account });

      if (users.length === 0) {
        res.status(404);
        res.send({
          message: 'cannot find'
        });
      }
      else {
        const user = users[0];

        res.send({
          message: 'ok',
          info: {
            id: user.id,
            available: user.isAvailable,
            registeredAt: user.registeredAt.toISOString(),
            account: user.account,
            name: user.name,
            email: user.email,
            phonetic: user.phonetic,
            department: user.department,
            section: user.section,
            qrCodeIssueNum: user.qrCodeIssuedNum,
            defaultWorkPatternName: user.defaultWorkPatternName,
            optional1WorkPatternName: user.optional1WorkPatternName,
            optional2WorkPatternName: user.optional2WorkPatternName
          }
        });
      }
    } catch (error) {
      const err = error as Error;
      res.status(400);
      res.send({ message: error.message });
    }
  });

  app.get<{}, apiif.UserInfosResponseBody, {}, apiif.UserInfoRequestQuery>('/api/user', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const users = await access.getUsers(token, {
        byId: req.query.id,
        byAccount: req.query.account,
        byName: req.query.name,
        byDepartment: req.query.department,
        bySection: req.query.section,
        byPhonetic: req.query.phonetic,
        registeredFrom: req.query.registeredFrom ? new Date(req.query.registeredFrom) : undefined,
        registeredTo: req.query.registeredTo ? new Date(req.query.registeredTo) : undefined,
        isQrCodeIssued: req.query.isQrCodeIssued,
        limit: req.query.limit,
        offset: req.query.offset
      });

      res.send({
        message: 'ok',
        infos: users.map<apiif.UserInfoResponseData>((user) => {
          return {
            id: user.id,
            available: user.isAvailable,
            registeredAt: user.registeredAt.toISOString(),
            account: user.account,
            name: user.name,
            phonetic: user.phonetic,
            email: user.email,
            section: user.section,
            department: user.department,
            qrCodeIssueNum: user.qrCodeIssuedNum,
            defaultWorkPatternName: user.defaultWorkPatternName,
            optional1WorkPatternName: user.optional1WorkPatternName,
            optional2WorkPatternName: user.optional2WorkPatternName
          }
        })
      });
    } catch (error) {
      const err = error as Error;
      res.status(400);
      res.send({ message: error.message });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 認証関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.IssueTokenResponseBody, apiif.IssueTokenRequestBody>('/api/token/issue', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const token = await access.issueRefreshToken(req.body.account, req.body.password);
      res.send({
        message: 'ok',
        token: token
      });
    }
    catch (error) {
      const err = error as Error;
      if (err.name === 'AuthenticationError') {
        res.status(401);
        res.send({ message: err.message });
      }
      else if (err.name === 'UserNotAvailableError') {
        res.status(403);
        res.send({ message: err.message });
      }
      else {
        res.status(400);
        res.send({ message: err.message });
      }
    }
  });

  app.post<{ account: string }, apiif.IssueTokenResponseBody>('/api/token/issue/:account', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const issuerToken = extractTokenFromHeader(authHeader);
      if (!issuerToken) {
        throw new Error('invalid Authorization header');
      }

      const token = await access.issueQrCodeRefreshToken(issuerToken, req.params.account);
      res.send({
        message: 'ok',
        token: token
      });
    }
    catch (error) {
      const err = error as Error;
      if (err.name === 'AuthenticationError') {
        res.status(401);
        res.send({ message: err.message });
      }
      else if (err.name === 'UserNotAvailableError') {
        res.status(403);
        res.send({ message: err.message });
      }
      else {
        console.log(error);
        res.status(400);
        res.send({ message: err.message });
      }
    }
  });

  app.post<{}, apiif.AccessTokenResponseBody, apiif.AccessTokenRequestBody>('/api/token/refresh', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const token = await access.issueAccessToken(req.body.refreshToken);
      res.send({
        message: 'ok',
        token: <apiif.AccessTokenResponseData>{ accessToken: token }
      });
    }
    catch (error) {
      const err = error as Error;
      if (err.name === 'AuthenticationError') {
        res.status(401);
        res.send({ message: err.message });
      }
      else if (err.name === 'TokenExpiredError') {
        res.status(403);
        res.send({ message: err.message });
      }
      else {
        res.status(400);
        res.send({ message: err.message });
      }
    }
  });

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.RevokeTokenRequestBody>('/api/token/revoke', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      await access.revokeRefreshToken(req.body.account, req.body.refreshToken);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      const err = error as Error;
      res.status(400);
      res.send({ message: err.message });
    }
  });

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.ChangePasswordRequestBody>('/api/token/password', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      await access.changeUserPassword(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      const err = error as Error;
      if (err.name === 'AuthenticationError') {
        res.status(401);
        res.send({ message: err.message });
      }
      else {
        res.status(400);
        res.send({ message: error.toString() });
        console.log(error);
      }
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 権限関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.PrivilageRequestData>('/api/privilage', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      await access.addPrivilege(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.PrivilegeResponseBody, {}, { limit: number, offset: number }>('/api/privilage', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const privileges = await access.getPrivileges(token);
      res.send({
        message: 'ok',
        privileges: privileges
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{ id: number }, apiif.ApplyPrivilegeResponseBody, {}, { limit: number, offset: number }>('/api/apply-privilage/:id', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const applyPrivileges = await access.getApplyPrivilege(token, req.params.id);
      console.log(applyPrivileges)
      res.send({
        message: 'ok',
        applyPrivileges: applyPrivileges
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.PrivilageRequestData>('/api/privilage', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      await access.updatePrivilege(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
      console.log(error);
    }
  });

  app.delete<{ id: number }, apiif.MessageOnlyResponseBody>('/api/privilage/:id', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deletePrivilege(token, req.params.id);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 打刻関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ type: string }, apiif.MessageOnlyResponseBody, apiif.RecordRequestBody>('/api/record/:type', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      await access.putRecord(token, {
        account: req.body.account,
        type: req.params.type,
        timestamp: new Date(req.body.timestamp),
        deviceAccount: req.body.deviceAccount,
        deviceToken: req.body.deviceToken
      });
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      const err = error as Error;
      res.status(400);
      res.send({ message: err.message });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 機器関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.DeviceRequestData>('/api/device', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      await access.addDevice(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.DevicesResponseBody>('/api/devices', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const devices = await access.getDevicesOld();
      res.send({
        message: 'ok',
        devices: devices
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.DeviceRequestData>('/api/device', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      await access.updateDevice(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
      console.log(error);
    }
  });

  app.delete<{ account: string }, apiif.MessageOnlyResponseBody>('/api/device/:account', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deleteDevice(token, req.params.account);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{ limit: number, offset: number }, apiif.DevicesResponseBody>('/api/device', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const devices = await access.getDevices(token, req.query);
      res.send({
        message: 'ok',
        devices: devices
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.DepartmentResponseBody>('/api/department', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const departments = await access.getDepartments();
      res.send({
        message: 'ok',
        departments: departments
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{ type: string }, apiif.ApplyOptionsResponseBody>('/api/options/apply/:type', async (req, res) => {
    if (!req.params.type) {
      res.status(400);
      res.send({ message: 'type not specified' });
      return;
    }
    try {
      const access = new DatabaseAccess(knex);
      const optionTypes = await access.getApplyOptionTypes(req.params.type);
      res.send({
        message: 'ok',
        optionTypes: optionTypes
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  // 承認ルート役割
  app.get<{}, apiif.ApprovalRouteRoleBody>('/api/apply/role', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const roles = await access.getApprovalRouteRoles();
      res.send({
        message: 'ok',
        roles: roles
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 承認ルート関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.ApprovalRouteRequestData>('/api/apply/route', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.addApprovalRoute(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.ApprovalRouteResponseBody, {}, { limit: number, offset: number }>('/api/apply/route', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.getApprovalRoutes(token, req.query);
      res.send({
        message: 'ok',
        routes: routes
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{ name: string }, apiif.ApprovalRouteResponseBody, {}, { limit: number, offset: number }>('/api/apply/route/:name', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.getApprovalRoutes(token, undefined, req.params.name);
      res.send({
        message: 'ok',
        routes: routes
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.ApprovalRouteRequestData>('/api/apply/route', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.updateApprovalRoute(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
      console.log(error);
    }
  });

  app.delete<{ id: number }, apiif.MessageOnlyResponseBody>('/api/apply/route/:id', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deleteApprovalRoute(token, req.params.id);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 申請関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ applyType: string }, { message: string, id?: number }, apiif.ApplyRequestBody>('/api/apply/:applyType', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const id = await access.submitApply(token, req.params.applyType, req.body);
      console.log(id);
      res.send({
        message: 'ok',
        id: id
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.post<{}, { message: string, id?: number }, apiif.ApplyTypeRequestData>('/api/apply-type', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);

      const id = await access.addApplyType(req.body);
      res.send({
        message: 'ok',
        id: id
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.ApplyTypeResponseBody, {}, { limit: number, offset: number }>('/api/apply-type', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);

      const applyTypes = await access.getApplyTypes();
      res.send({
        message: 'ok',
        applyTypes: applyTypes
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.ApplyTypeRequestData>('/api/apply-type', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);

      const id = await access.updateApplyType(req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.delete<{ name: string }, apiif.MessageOnlyResponseBody, {}>('/api/apply-type/:name', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);

      const applyTypes = await access.deleteApplyType(req.params.name);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 勤務体系関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.WorkPatternRequestData>('/api/work-pattern', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.addWorkPattern(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.WorkPatternsResponseBody, {}, { limit: number, offset: number }>('/api/work-pattern', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const workPatterns = await access.getWorkPatterns(token, req.query);
      res.send({
        message: 'ok',
        workPatterns: workPatterns
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{ name: string }, apiif.WorkPatternResponseBody, {}, { limit: number, offset: number }>('/api/work-pattern/:name', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const workPattern = await access.getWorkPattern(token, req.params.name, req.query);
      res.send({
        message: 'ok',
        workPattern: workPattern
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.WorkPatternRequestData>('/api/work-pattern', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const id = await access.updateWorkPattern(token, req.body);
      console.log(id);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.delete<{ id: number }, apiif.MessageOnlyResponseBody>('/api/work-pattern/:id', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deleteWorkPattern(token, req.params.id);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.UserWorkPatternCalendarRequestData>('/api/work-pattern-calendar', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.setUserWorkPatternCalendar(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.UserWorkPatternCalendarResponseBody, {}, apiif.UserWorkPatternCalendarRequestQuery>('/api/work-pattern-calendar', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const workPatternCalendars = await access.getUserWorkPatternCalendar(token, req.query);
      res.send({
        message: 'ok',
        userWorkPatternCalendars: workPatternCalendars
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.delete<{ date: string, account: string }, apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar/:date/:account', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deleteUserWorkPatternCalendar(token, req.params.date, req.params.account);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.delete<{ date: string }, apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar/:date', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deleteUserWorkPatternCalendar(token, req.params.date);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // 休日登録
  ///////////////////////////////////////////////////////////////////////
  app.post<{}, apiif.MessageOnlyResponseBody, apiif.HolidayRequestData>('/api/holiday', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.setHoliday(token, req.body);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.get<{}, apiif.HolidaysResponseBody, {}, apiif.HolidayRequestQuery>('/api/holiday', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const holidays = await access.getHolidays(req.query);
      res.send({
        message: 'ok',
        holidays: holidays
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  app.delete<{ date: string }, apiif.MessageOnlyResponseBody>('/api/holiday/:date', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      const authHeader = req.get('Authorization');
      if (!authHeader) {
        throw new Error('Authorization header not found');
      }

      const token = extractTokenFromHeader(authHeader);
      if (!token) {
        throw new Error('invalid Authorization header');
      }

      const routes = await access.deleteHoliday(token, req.params.date);
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

  ///////////////////////////////////////////////////////////////////////
  // メール送信
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, {
    from: string, to: string, cc?: string, subject: string, body: string
  }>('/api/mail', async (req, res) => {
    try {
      const access = new DatabaseAccess(knex);
      await access.queueMail({
        to: req.body.to,
        from: req.body.from,
        cc: req.body.cc,
        subject: req.body.subject,
        body: req.body.body.replace('\\n', '\r\n').replace('\\t', '\t')
      });
      res.send({
        message: 'ok'
      });
    }
    catch (error) {
      res.status(400);
      res.send({ message: error.toString() });
    }
  });

}