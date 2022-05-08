import type { Express } from 'express';
import asyncHandler from 'express-async-handler';

import { Knex } from "knex";
import * as apiif from './APIInterfaces';
import { verifyJsonWebToken } from './verify';
import { DatabaseAccess, type UserInfo } from './dataaccess';
import createHttpError from 'http-errors';

declare global {
  namespace Express {
    export interface Request {
      user?: UserInfo
    }
  }
}

export default function registerHandlers(app: Express, knex: Knex) {

  // アクセストークンがヘッダーにある場合はユーザー情報を取得する
  app.use(function (req, res, next) {
    //console.log('req.path=' + req.path);
    if (req.token) {
      try {
        const userInfo = verifyJsonWebToken(req.token) as UserInfo;
        req.user = { id: userInfo.id, account: userInfo.account }
      }
      catch (error) {
        if (error instanceof Error) {
          if (error.name === 'TokenExpiredError' || error.name === 'NotBeforeError') {
            //throw new createHttpError.Unauthorized(error.toString());
            throw createHttpError(401, error.message, { internalMessage: error.toString() });
          }
          else if (error.name === 'JsonWebTokenError') {
            //throw new createHttpError.BadRequest(error.toString());
            throw createHttpError(400, error.message, { internalMessage: error.toString() });
          }
        }
        throw createHttpError(500, { internalMessage: (error as object).toString() });
      }
    }
    next();
  });

  // NODE_AUDITが有効な場合は監査ログを記録する
  if (process.env.NODE_AUDIT && (process.env.NODE_AUDIT.toLowerCase() === 'true' || process.env.NODE_AUDIT === '1')) {
    app.use(asyncHandler(async (req, res, next) => {
      if (req.method !== 'OPTIONS') {
        await knex('auditLog').insert({
          timestamp: new Date(),
          account: req.user ? req.user.account : undefined,
          method: req.method,
          path: req.path,
          params: req.params ? JSON.stringify(req.params).substring(0, 254) : undefined,
          query: req.query ? JSON.stringify(req.query).substring(0, 254) : undefined,
          body: req.body ? JSON.stringify(req.body).substring(0, 1022) : undefined
        });
      }
      next();
    }));
  }

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, {}, apiif.UserInfoRequestData[]>('/api/user', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addUsers(req.body);
    res.send({});
  }));

  app.get<{ account: string }, apiif.UserAccountCandidatesResponseBody>('/api/user/account-candidates', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', candidates: await new DatabaseAccess(knex).generateAvailableUserAccount() });
  }));

  app.get<{ account: string }, apiif.UserInfoResponseData>('/api/user/:account', asyncHandler(async (req, res) => {
    const users = await new DatabaseAccess(knex).getUsersInfo({ accounts: [req.params.account] });
    if (users.length > 0) {
      res.send(users[0]);
    }
    else {
      throw new createHttpError.NotFound(`ユーザー ${req.params.account} が見つかりません。`);
    }
  }));

  app.get<{}, apiif.UserInfoResponseData[], {}, apiif.UserInfoRequestQuery>('/api/user', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).getUsersInfo(req.query));
  }));

  ///////////////////////////////////////////////////////////////////////
  // 認証関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.IssueTokenResponseData, apiif.IssueTokenRequestBody>('/api/token/issue', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).issueRefreshToken(req.body.account, req.body.password));
  }));

  app.post<{ account: string }, apiif.IssueTokenResponseData>('/api/token/issue/:account', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).issueQrCodeRefreshToken(req.params.account));
  }));

  app.post<{}, apiif.AccessTokenResponseData, apiif.AccessTokenRequestBody>('/api/token/refresh', asyncHandler(async (req, res) => {
    res.send({ accessToken: await new DatabaseAccess(knex).issueAccessToken(req.body.refreshToken) });
  }));

  app.post<{}, {}, apiif.RevokeTokenRequestBody>('/api/token/revoke', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).revokeRefreshToken(req.body.account, req.body.refreshToken);
    res.send({});
  }));

  app.put<{}, {}, apiif.ChangePasswordRequestBody>('/api/token/password', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).changeUserPassword(req.user, req.body);
    res.send({});
  }));

  ///////////////////////////////////////////////////////////////////////
  // 権限関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, {}, apiif.PrivilageRequestData>('/api/privilage', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addPrivilege(req.body);
    res.send({});
  }));

  app.get<{ account: string }, apiif.PrivilegeResponseData[]>('/api/privilage/:account', asyncHandler(async (req, res) => {
    res.send([await new DatabaseAccess(knex).getUserPrivilege(req.params.account)]);
  }));

  app.get<{}, apiif.PrivilegeResponseData[], {}, { limit: number, offset: number }>('/api/privilage', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).getPrivileges());
  }));

  app.get<{ id: number }, apiif.ApplyPrivilegeResponseBody, {}, { limit: number, offset: number }>('/api/apply-privilage/:id', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applyPrivileges: await new DatabaseAccess(knex).getApplyPrivilege(req.params.id) });
  }));

  app.put<{}, {}, apiif.PrivilageRequestData>('/api/privilage', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updatePrivilege(req.body);
    res.send({});
  }));

  app.delete<{ id: number }>('/api/privilage/:id', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deletePrivilege(req.params.id);
    res.send({});
  }));

  ///////////////////////////////////////////////////////////////////////
  // 打刻関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ type: string }, {}, apiif.RecordRequestBody>('/api/record/:type', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).submitRecord(req.user, req.params.type, req.body);
    res.send({});
  }));

  app.get<{}, apiif.RecordResponseData[], {}, apiif.RecordRequestQuery>('/api/record', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).getRecords(req.query));
  }));

  ///////////////////////////////////////////////////////////////////////
  // 機器関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, {}, apiif.DeviceRequestData>('/api/device', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addDevice(req.body);
    res.send({});
  }));

  app.put<{}, {}, apiif.DeviceRequestData>('/api/device', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updateDevice(req.body);
    res.send({});
  }));

  app.delete<{ account: string }>('/api/device/:account', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteDevice(req.params.account);
    res.send({});
  }));

  app.get<{ limit: number, offset: number }, apiif.DevicesResponseBody>('/api/device', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', devices: await new DatabaseAccess(knex).getDevices(req.query) });
  }));

  app.get<{}, apiif.DepartmentResponseBody>('/api/department', async (req, res) => {
    res.send({ message: 'ok', departments: await new DatabaseAccess(knex).getDepartments() });
  });

  app.get<{ type: string }, apiif.ApplyOptionsResponseBody>('/api/options/apply/:type', asyncHandler(async (req, res) => {
    if (!req.params.type) {
      res.status(400).send({ message: 'type not specified' });
    } else {
      res.send({ message: 'ok', optionTypes: await new DatabaseAccess(knex).getApplyOptionTypes(req.params.type) });
    }
  }));

  ///////////////////////////////////////////////////////////////////////
  // 承認ルート関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, {}, apiif.ApprovalRouteRequestData>('/api/apply/route', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addApprovalRoute(req.body);
    res.send({});
  }));

  app.get<{}, apiif.ApprovalRouteResponseData[], {}, { limit: number, offset: number }>('/api/apply/route', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).getApprovalRoutes(req.query));
  }));

  app.get<{ name: string }, apiif.ApprovalRouteResponseData[]>('/api/apply/route/:name', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).getApprovalRoutes(undefined, req.params.name));
  }));

  app.put<{}, {}, apiif.ApprovalRouteRequestData>('/api/apply/route', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updateApprovalRoute(req.body);
    res.send({});
  }));

  app.delete<{ id: number }>('/api/apply/route/:id', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteApprovalRoute(req.params.id);
    res.send({});
  }));

  ///////////////////////////////////////////////////////////////////////
  // 申請関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ applyType: string }, { message: string, id?: number }, apiif.ApplyRequestBody>('/api/apply/:applyType', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    res.send({ message: 'ok', id: await new DatabaseAccess(knex).submitApply(req.user, req.params.applyType, req.body) });
  }));

  app.get<{ applyId: number }, apiif.ApplyTypeResponseBody, {}>('/api/apply/applyType/:applyId', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applyTypes: [await new DatabaseAccess(knex).getApplyTypeOfApply(req.params.applyId)] });
  }));

  app.get<{ applyId: number }, apiif.ApplyResponseBody, {}>('/api/apply/:applyId', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applies: [await new DatabaseAccess(knex).getApply(req.params.applyId)] });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 申請承認関連
  ///////////////////////////////////////////////////////////////////////

  app.get<{ applyId: number }, apiif.UserInfoResponseData[]>('/api/approve/:applyId', asyncHandler(async (req, res) => {
    res.send(await new DatabaseAccess(knex).getApplyCurrentApprovingUsers(req.params.applyId));
  }));

  app.post<{ applyId: number }>('/api/approve/:applyId', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).approveApply(req.user, req.params.applyId, true);
    res.send({});
  }));

  app.post<{ applyId: number }>('/api/reject/:applyId', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).approveApply(req.user, req.params.applyId, false);
    res.send({});
  }));

  ///////////////////////////////////////////////////////////////////////
  // 申請種類関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, { message: string, id?: number }, apiif.ApplyTypeRequestData>('/api/apply-type', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', id: await new DatabaseAccess(knex).addApplyType(req.body) });
  }));

  app.get<{}, apiif.ApplyTypeResponseBody, {}, { limit: number, offset: number }>('/api/apply-type', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applyTypes: await new DatabaseAccess(knex).getApplyTypes() });
  }));

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.ApplyTypeRequestData>('/api/apply-type', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updateApplyType(req.body);
    res.send({ message: 'ok' });
  }));

  app.delete<{ name: string }, apiif.MessageOnlyResponseBody, {}>('/api/apply-type/:name', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteApplyType(req.params.name);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 勤務体系関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.WorkPatternRequestData>('/api/work-pattern', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addWorkPattern(req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.WorkPatternsResponseBody, {}, { limit: number, offset: number }>('/api/work-pattern', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', workPatterns: await new DatabaseAccess(knex).getWorkPatterns(req.query) });
  }));

  app.get<{ name: string }, apiif.WorkPatternResponseBody, {}, { limit: number, offset: number }>('/api/work-pattern/:name', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', workPattern: await new DatabaseAccess(knex).getWorkPattern(req.params.name, req.query) });
  }));

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.WorkPatternRequestData>('/api/work-pattern', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updateWorkPattern(req.body);
    res.send({ message: 'ok' });
  }));

  app.delete<{ id: number }, apiif.MessageOnlyResponseBody>('/api/work-pattern/:id', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteWorkPattern(req.params.id);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 従業員ごと勤務体系登録関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.UserWorkPatternCalendarRequestData>('/api/work-pattern-calendar', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).setUserWorkPatternCalendar(req.user, req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.UserWorkPatternCalendarResponseBody, {}, apiif.UserWorkPatternCalendarRequestQuery>('/api/work-pattern-calendar', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    res.send({
      message: 'ok',
      userWorkPatternCalendars: await new DatabaseAccess(knex).getUserWorkPatternCalendar(req.user, req.query)
    });
  }));

  app.delete<{ date: string, account: string }, apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar/:date/:account', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).deleteUserWorkPatternCalendar(req.user, req.params.date, req.params.account);
    res.send({ message: 'ok' });
  }));

  app.delete<{ date: string }, apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar/:date', asyncHandler(async (req, res) => {
    if (!req.user) { throw new createHttpError.Unauthorized('ログインが必要です') }
    await new DatabaseAccess(knex).deleteUserWorkPatternCalendar(req.user, req.params.date);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 休日登録
  ///////////////////////////////////////////////////////////////////////
  app.post<{}, {}, apiif.HolidayRequestData>('/api/holiday', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).setHoliday(req.body);
    res.send({});
  }));

  app.get<{}, apiif.HolidaysResponseBody, {}, apiif.HolidayRequestQuery>('/api/holiday', asyncHandler(async (req, res) => {
    console.log(req.query);
    res.send({ message: 'ok', holidays: await new DatabaseAccess(knex).getHolidays(req.query) });
  }));

  app.delete<{ date: string }>('/api/holiday/:date', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteHoliday(req.params.date);
    res.send({});
  }));

  ///////////////////////////////////////////////////////////////////////
  // システム設定
  ///////////////////////////////////////////////////////////////////////
  app.post<{}, {}, apiif.SystemConfigRequestData>('/api/config', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).setSystemConfig(req.body.key, req.body.value);
    res.send({});
  }));

  app.get<{ key: string }, apiif.SystemConfigResponseBody>('/api/config/:key', asyncHandler(async (req, res) => {
    res.send({
      message: 'ok',
      config: [
        { key: req.params.key, value: await new DatabaseAccess(knex).getSystemConfigValue(req.params.key) }
      ]
    });
  }));

  app.get<{}, apiif.SystemConfigResponseBody, {}, apiif.SystemConfigQuery>('/api/config', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', config: await new DatabaseAccess(knex).getSystemConfig(req.query) });
  }));

  ///////////////////////////////////////////////////////////////////////
  // メール送信
  ///////////////////////////////////////////////////////////////////////

  app.post<{ applyId: number }, apiif.MessageOnlyResponseBody, { url?: string }>('/api/mail/apply/:applyId', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).sendApplyMail(req.params.applyId, req.body.url);
    res.send({ message: 'ok' });
  }));

  app.post<{ applyId: number }, apiif.MessageOnlyResponseBody, { url?: string }>('/api/mail/reject/:applyId', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).sendApplyRejectedMail(req.params.applyId, req.body.url);
    res.send({ message: 'ok' });
  }));

  app.post<{ applyId: number }, apiif.MessageOnlyResponseBody, { url?: string }>('/api/mail/approve/:applyId', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).sendApplyApprovedMail(req.params.applyId, req.body.url);
    res.send({ message: 'ok' });
  }));

  app.post<{}, apiif.MessageOnlyResponseBody, {
    from: string, to: string, cc?: string, subject: string, body: string
  }>('/api/mail', asyncHandler(async (req, res) => {
    const access = new DatabaseAccess(knex);
    await access.queueMail({
      to: req.body.to,
      from: req.body.from,
      cc: req.body.cc,
      subject: req.body.subject,
      body: req.body.body.replace('\\n', '\r\n').replace('\\t', '\t')
    });
    res.send({ message: 'ok' });
  }));
}