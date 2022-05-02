import type { Express } from 'express';
import asyncHandler from 'express-async-handler';

import { Knex } from "knex";
import * as apiif from 'shared/APIInterfaces';
import { DatabaseAccess } from './dataaccess';
import type { UserInfo } from './dataaccess';
import { verifyAccessToken } from './verify';

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
        const userInfo = verifyAccessToken(req.token) as UserInfo;
        req.user = { id: userInfo.id, account: userInfo.account }
      }
      catch (error) {
        if (error.name === 'TokenExpiredError') {
          res.status(401);
        }
        else if (error.name === 'NotBeforeError') {
          res.status(401);
        }
        else if (error.name === 'JsonWebTokenError') {
          if (error.message === 'invalid token' || error.message === 'jwt malformed') {
            res.status(400);
          }
          else {
            res.status(401);
          }
        }
        else {
          res.status(500);
        }
        return res.send({ message: error.toString() });
      }
    }
    else {
      // アクセストークンが無い場合

    }
    next();
  });

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.UserInfoRequestData>('/api/user', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addUser(req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{ account: string }, apiif.UserInfoResponseBody>('/api/user/:account', asyncHandler(async (req, res) => {
    const access = new DatabaseAccess(knex);
    const users = await access.getUsers({ byAccounts: [req.params.account] });

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
  }));

  app.get<{}, apiif.UserInfosResponseBody, {}, apiif.UserInfoRequestQuery>('/api/user', asyncHandler(async (req, res) => {
    const access = new DatabaseAccess(knex);
    const users = await access.getUsers({
      byId: req.query.id,
      byAccounts: req.query.accounts,
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
  }));

  app.get<{ account: string }, apiif.UserAccountCandidatesResponseBody>('/api/user/account-candidates', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', candidates: await new DatabaseAccess(knex).generateAvailableUserAccount() });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 認証関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.IssueTokenResponseBody, apiif.IssueTokenRequestBody>('/api/token/issue', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', token: await new DatabaseAccess(knex).issueRefreshToken(req.body.account, req.body.password) });
  }));

  app.post<{ account: string }, apiif.IssueTokenResponseBody>('/api/token/issue/:account', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', token: await new DatabaseAccess(knex).issueQrCodeRefreshToken(req.params.account) });
  }));

  app.post<{}, apiif.AccessTokenResponseBody, apiif.AccessTokenRequestBody>('/api/token/refresh', asyncHandler(async (req, res) => {
    res.send({
      message: 'ok',
      token: <apiif.AccessTokenResponseData>{
        accessToken: await new DatabaseAccess(knex).issueAccessToken(req.body.refreshToken)
      }
    });
  }));

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.RevokeTokenRequestBody>('/api/token/revoke', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).revokeRefreshToken(req.body.account, req.body.refreshToken);
    res.send({ message: 'ok' });
  }));

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.ChangePasswordRequestBody>('/api/token/password', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).changeUserPassword(req.user, req.body);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 権限関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.PrivilageRequestData>('/api/privilage', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addPrivilege(req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{ account: string }, apiif.PrivilegeResponseBody>('/api/privilage/:account', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', privileges: [await new DatabaseAccess(knex).getUserPrivilege(req.params.account)] });
  }));

  app.get<{}, apiif.PrivilegeResponseBody, {}, { limit: number, offset: number }>('/api/privilage', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', privileges: await new DatabaseAccess(knex).getPrivileges() });
  }));

  app.get<{ id: number }, apiif.ApplyPrivilegeResponseBody, {}, { limit: number, offset: number }>('/api/apply-privilage/:id', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applyPrivileges: await new DatabaseAccess(knex).getApplyPrivilege(req.params.id) });
  }));

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.PrivilageRequestData>('/api/privilage', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updatePrivilege(req.body);
    res.send({ message: 'ok' });
  }));

  app.delete<{ id: number }, apiif.MessageOnlyResponseBody>('/api/privilage/:id', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deletePrivilege(req.params.id);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 打刻関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ type: string }, apiif.MessageOnlyResponseBody, apiif.RecordRequestBody>('/api/record/:type', asyncHandler(async (req, res) => {
    const access = new DatabaseAccess(knex);
    await access.submitRecord(req.user, {
      account: req.body.account,
      type: req.params.type,
      timestamp: new Date(req.body.timestamp),
      deviceAccount: req.body.deviceAccount,
      deviceToken: req.body.deviceToken
    });
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.RecordResponseBody, {}, apiif.RecordRequestQuery>('/api/record', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', records: await new DatabaseAccess(knex).getRecords(req.query) });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 機器関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.DeviceRequestData>('/api/device', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addDevice(req.token, req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.DevicesResponseBody>('/api/devices', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', devices: await new DatabaseAccess(knex).getDevicesOld() });
  }));

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.DeviceRequestData>('/api/device', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updateDevice(req.token, req.body);
    res.send({ message: 'ok' });
  }));

  app.delete<{ account: string }, apiif.MessageOnlyResponseBody>('/api/device/:account', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteDevice(req.token, req.params.account);
    res.send({ message: 'ok' });
  }));

  app.get<{ limit: number, offset: number }, apiif.DevicesResponseBody>('/api/device', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', devices: await new DatabaseAccess(knex).getDevices(req.token, req.query) });
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

  // 承認ルート役割
  app.get<{}, apiif.ApprovalRouteRoleBody>('/api/apply/role', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', roles: await new DatabaseAccess(knex).getApprovalRouteRoles() });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 承認ルート関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{}, apiif.MessageOnlyResponseBody, apiif.ApprovalRouteRequestData>('/api/apply/route', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).addApprovalRoute(req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.ApprovalRouteResponseBody, {}, { limit: number, offset: number }>('/api/apply/route', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', routes: await new DatabaseAccess(knex).getApprovalRoutes(req.query) });
  }));

  app.get<{ name: string }, apiif.ApprovalRouteResponseBody, {}>('/api/apply/route/:name', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', routes: await new DatabaseAccess(knex).getApprovalRoutes(undefined, req.params.name) });
  }));

  app.put<{}, apiif.MessageOnlyResponseBody, apiif.ApprovalRouteRequestData>('/api/apply/route', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).updateApprovalRoute(req.body);
    res.send({ message: 'ok' });
  }));

  app.delete<{ id: number }, apiif.MessageOnlyResponseBody>('/api/apply/route/:id', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteApprovalRoute(req.params.id);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 申請関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ applyType: string }, { message: string, id?: number }, apiif.ApplyRequestBody>('/api/apply/:applyType', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', id: await new DatabaseAccess(knex).submitApply(req.user, req.params.applyType, req.body) });
  }));

  app.get<{ applyId: number }, apiif.ApplyTypeResponseBody, {}>('/api/apply/applyType/:applyId', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applyTypes: [await new DatabaseAccess(knex).getApplyTypeOfApply(req.token, req.params.applyId)] });
  }));

  app.get<{ applyId: number }, apiif.ApplyResponseBody, {}>('/api/apply/:applyId', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', applies: [await new DatabaseAccess(knex).getApply(req.params.applyId)] });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 申請承認関連
  ///////////////////////////////////////////////////////////////////////

  app.post<{ applyId: number }, apiif.MessageOnlyResponseBody>('/api/approve/:applyId', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).approveApply(req.user, req.params.applyId, true);
    res.send({ message: 'ok' });
  }));

  app.post<{ applyId: number }, apiif.MessageOnlyResponseBody>('/api/reject/:applyId', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).approveApply(req.user, req.params.applyId, false);
    res.send({ message: 'ok' });
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
    await new DatabaseAccess(knex).setUserWorkPatternCalendar(req.user, req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.UserWorkPatternCalendarResponseBody, {}, apiif.UserWorkPatternCalendarRequestQuery>('/api/work-pattern-calendar', asyncHandler(async (req, res) => {
    res.send({
      message: 'ok',
      userWorkPatternCalendars: await new DatabaseAccess(knex).getUserWorkPatternCalendar(req.user, req.query)
    });
  }));

  app.delete<{ date: string, account: string }, apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar/:date/:account', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteUserWorkPatternCalendar(req.user, req.params.date, req.params.account);
    res.send({ message: 'ok' });
  }));

  app.delete<{ date: string }, apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar/:date', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteUserWorkPatternCalendar(req.user, req.params.date);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // 休日登録
  ///////////////////////////////////////////////////////////////////////
  app.post<{}, apiif.MessageOnlyResponseBody, apiif.HolidayRequestData>('/api/holiday', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).setHoliday(req.body);
    res.send({ message: 'ok' });
  }));

  app.get<{}, apiif.HolidaysResponseBody, {}, apiif.HolidayRequestQuery>('/api/holiday', asyncHandler(async (req, res) => {
    res.send({ message: 'ok', holidays: await new DatabaseAccess(knex).getHolidays(req.query) });
  }));

  app.delete<{ date: string }, apiif.MessageOnlyResponseBody>('/api/holiday/:date', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).deleteHoliday(req.params.date);
    res.send({ message: 'ok' });
  }));

  ///////////////////////////////////////////////////////////////////////
  // システム設定
  ///////////////////////////////////////////////////////////////////////
  app.post<{}, apiif.MessageOnlyResponseBody, apiif.SystemConfigRequestData>('/api/config', asyncHandler(async (req, res) => {
    await new DatabaseAccess(knex).setSystemConfig(req.body.key, req.body.value);
    res.send({ message: 'ok' });
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