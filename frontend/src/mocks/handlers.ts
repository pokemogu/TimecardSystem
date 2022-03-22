import { rest } from 'msw'
import type { DefaultRequestBody, PathParams } from 'msw'

import * as db from './db'
import type * as apiif from 'shared/APIInterfaces';
import type * as models from 'shared/models';

const generateRandomString = (length: number) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let password = '';

  for (let i = 0; i <= length; i++) {
    const randomNumber = Math.floor(Math.random() * chars.length);
    password += chars.substring(randomNumber, randomNumber + 1);
  }
  return password;
};

const generateDummyToken = () => (generateRandomString(36) + '.' + generateRandomString(74) + '.' + generateRandomString(43));

const getUserFromTokenHeader = (header?: string | null) => {
  const nowMilliSec = Date.now();

  // トークンヘッダ確認
  if (!header) {
    return undefined;
  }
  const matches = header.match(/^Bearer (\w+\.\w+\.\w+)$/);
  if (!matches || matches.length < 1) {
    return undefined;
  }
  const accessToken = matches[1];

  // トークン認証
  const token = db.tokens.find((token) => token.accessToken === accessToken);
  if (!token || !token.accessTokenExpiration || token.accessTokenExpiration < nowMilliSec) {
    return undefined;
  }

  return db.users.find((user) => user.id === token.user);
}

export const handlers = [
  // Handles a POST /login request
  rest.post<apiif.IssueTokenRequestBody, PathParams, apiif.IssueTokenResponseBody>('/api/token/issue', (req, res, ctx) => {

    const user = db.users.find((user) => user.account === req.body.account);
    if (!user || !user.available || user.password !== req.body.password) {
      return res(ctx.status(401), ctx.json({ message: 'authorization failed' }));
    }

    const nowMilliSec = Date.now();
    const refreshToken = generateDummyToken();
    const refreshTokenExpiration = nowMilliSec + (1000 * 60 * 60);

    const id = db.tokens.map(token => token.id).reduce((prev, current) => prev < current ? current : prev, 0) + 1;

    db.tokens.push({
      id: id,
      user: user.id || 0,
      refreshToken: refreshToken,
      refreshTokenExpiration: refreshTokenExpiration,
      isQrToken: false
    });

    const section = db.sections.find((section) => section.id === user.section);
    const department = db.departments.find((department) => department.id === section?.department);

    return res(ctx.status(200), ctx.json({
      message: 'ok',
      token: {
        name: user.name,
        department: department?.name || '',
        section: section?.name || '',
        refreshToken: refreshToken
      }
    }));
  }),

  rest.post<apiif.AccessTokenRequestBody, PathParams, apiif.AccessTokenResponseBody>('/api/token/refresh', (req, res, ctx) => {

    const token = db.tokens.find((token) => {
      return (token.refreshToken === req.body.refreshToken);
    });
    if (!token) {
      return res(ctx.status(401), ctx.json({ message: 'refresh token not issued' }));
    }

    const nowMilliSec = Date.now();

    if (token.refreshTokenExpiration < nowMilliSec) {
      return res(ctx.status(401), ctx.json({ message: 'refresh token expired' }));
    }

    token.accessToken = generateDummyToken();
    token.accessTokenExpiration = nowMilliSec + (1000 * 60 * 1);

    const user = db.users.find((user) => user.id === token.user);

    return res(ctx.status(200), ctx.json({
      message: 'ok',
      userId: user?.account || undefined,
      accessToken: token.accessToken
    }));
  }),

  rest.post<apiif.RevokeTokenRequestBody, PathParams, apiif.MessageOnlyResponseBody>('/api/token/revoke', (req, res, ctx) => {
    const nowMilliSec = Date.now();
    const tokenIndex = db.tokens.findIndex((token) => token.refreshToken === req.body.refreshToken);
    const user = db.users.find((user) => user.account === req.body.account);

    if (tokenIndex >= 0 && user) {
      if (db.tokens[tokenIndex].refreshTokenExpiration < nowMilliSec) {
        return res(ctx.status(401), ctx.json({ message: 'refresh token expired' }));
      }
      if (db.tokens[tokenIndex].user !== user.id) {
        return res(ctx.status(401), ctx.json({ message: 'invalid user' }));
      }
      db.tokens.splice(tokenIndex, 1);
      return res(ctx.status(200), ctx.json({ message: 'ok' }));
    }
    else {
      return res(ctx.status(401), ctx.json({ message: 'refresh token not issued' }));
    }
  }),

  rest.get<DefaultRequestBody, apiif.UserRequestPathParams, apiif.UserInfoResponseBody>('/api/user/:userId', (req, res, ctx) => {

    // ユーザー認証する
    const authorizedUser = getUserFromTokenHeader(req.headers.get('Authorization'));
    if (!authorizedUser) {
      return res(ctx.status(401), ctx.json({ message: 'authorization required' }));
    }

    // 取得対象となるユーザーを取得する
    const targetUser = db.users.find((user) => user.account === req.params.userId);
    if (!targetUser) {
      return res(ctx.status(404), ctx.json({ message: 'user not found' }));
    }

    const authorizedUserDepartment = db.sections.find((section) => section.id === authorizedUser.section)?.department;
    const targetUserDepartment = db.sections.find((section) => section.id === targetUser.section)?.department;

    // ユーザー情報を取得する権限があるかどうか確認する
    let isPermitted = false;
    const privilege = db.privileges.find(privilege => privilege.id === authorizedUser.privilege);
    if (targetUser.id === authorizedUser.id) { // 自分自身の情報は取得できる
      isPermitted = true;
    }
    else if (privilege) {
      // 全てのユーザー情報を取得する権限がある
      if (privilege.viewAllUserInfo) {
        isPermitted = true;
      }
      // 自部門の全てのユーザー情報を取得する権限がある
      else if (privilege.viewDepartmentUserInfo && authorizedUserDepartment && targetUserDepartment && (authorizedUserDepartment === targetUserDepartment)) {
        isPermitted = true;
      }
      // 自部署の全てのユーザー情報を取得する権限がある
      else if (privilege.viewSectionUserInfo && authorizedUser.section === targetUser.section) {
        isPermitted = true;
      }
    }

    // 自分のユーザー情報を取得する
    if (isPermitted) {
      return res(ctx.status(200), ctx.json(<apiif.UserInfoResponseBody>{
        message: 'ok',
        info: <apiif.UserInfoResponseData>{
          id: targetUser.account,
          name: targetUser.name,
          phonetic: targetUser.phonetic,
          email: targetUser.email,
          section: db.sections.find(section => section.id === targetUser.section)?.name ?? undefined,
          department: db.departments.find(department => department.id === targetUserDepartment)?.name ?? undefined
        }
      }));
    }
    else {
      return res(ctx.status(403), ctx.json({ message: 'do not have enough privilege' }));
    }
  }),

  rest.post<apiif.RecordRequestBody, apiif.RecordRequestPathParams, apiif.MessageOnlyResponseBody>('/api/record/:recordType', (req, res, ctx) => {

    // ユーザー認証する
    const user = getUserFromTokenHeader(req.headers.get('Authorization'));
    if (!user) {
      return res(ctx.status(401), ctx.json({ message: 'authorization required' }));
    }

    const recordId = db.records.map(record => record.id).reduce((prev, current) => prev < current ? current : prev, 0) + 1;
    const recordType = db.recordTypes.find(recordType => recordType.name === req.params.recordType);
    if (!recordType) {
      return res(ctx.status(400), ctx.json({ message: 'invalid record type' }));
    }

    db.records.push({
      id: recordId,
      user: user.id || 0,
      type: recordType.id,
      timestamp: new Date(req.body.timestamp)
    });

    console.dir(db.records);

    return res(ctx.status(200), ctx.json({ message: 'ok' }));
  }),

  rest.get<DefaultRequestBody, PathParams, apiif.DevicesResponseBody>('/api/devices', (req, res, ctx) => {
    const devices = db.devices.map((device) => { return { name: device.name } });
    return res(ctx.status(200), ctx.json(<apiif.DevicesResponseBody>{
      message: 'ok',
      devices: devices
    }));
  }),

  rest.post<apiif.DevicesRequestBody, PathParams, apiif.MessageOnlyResponseBody>('/api/devices', (req, res, ctx) => {
    const id = db.devices.map(device => device.id).reduce((prev, current) => prev < current ? current : prev, 0);
    db.devices.push({
      id: id,
      name: req.body.name
    });
    return res(ctx.status(200), ctx.json(<apiif.MessageOnlyResponseBody>{
      message: 'ok'
    }));
  }),

  rest.get<DefaultRequestBody, PathParams, apiif.DepartmentResponseBody>('/api/department', (req, res, ctx) => {
    const departments = db.departments.map((department) => { return { name: department.name } });

    const departmentsAndSections: apiif.DepartmentResponseData[] = [];
    for (const department of db.departments) {
      departmentsAndSections.push({
        name: department.name,
        sections: db.sections.filter((section) => section.department === department.id).map((section) => { return { name: section.name } })
      });
    }

    return res(ctx.status(200), ctx.json(<apiif.DepartmentResponseBody>{
      message: 'ok',
      departments: departmentsAndSections
    }));
  }),

  rest.post<apiif.ApplyRequestBody, apiif.ApplyRequestPathParams, apiif.MessageOnlyResponseBody>('/api/apply/:applyType', (req, res, ctx) => {

    // ユーザー認証する
    const user = getUserFromTokenHeader(req.headers.get('Authorization'));
    if (!user) {
      return res(ctx.status(401), ctx.json({ message: 'authorization required' }));
    }

    const applyId = db.applies.map(apply => apply.id).reduce((prev, current) => prev < current ? current : prev, 0) + 1;
    const applyType = db.applyTypes.find(applyType => applyType.name === req.params.applyType);
    if (!applyType) {
      return res(ctx.status(400), ctx.json({ message: 'invalid apply type' }));
    }

    let targetUser: models.User | undefined = undefined;
    if (req.body.targetUserAccount) {
      targetUser = db.users.find((user) => user.name === req.body.targetUserAccount);
      if (!targetUser) {
        return res(ctx.status(404), ctx.json({ message: 'target user id not found' }));
      }
    }

    db.applies.push({
      id: applyId,
      user: targetUser ? (targetUser.id || 0) : (user.id || 0),
      appliedUser: user.id,
      type: applyType.id,
      timestamp: new Date(req.body.timestamp),
      dateFrom: new Date(req.body.dateFrom),
      dateTo: req.body.dateTo ? new Date(req.body.dateTo) : undefined,
      dateRelated: req.body.dateRelated ? new Date(req.body.dateRelated) : undefined,
      reason: req.body.reason,
      contact: req.body.contact,
      route: 1
    });

    console.dir(db.applies);

    if (req.body.options) {
      for (const option of req.body.options) {
        const applyOptionType = db.applyOptionTypes.find((applyOptionType) => applyOptionType.name === option.name);
        const applyOptionValue = db.applyOptionTypeValues.find((applyOptionTypeValue) => applyOptionTypeValue.name === option.value);
        if (applyOptionType && applyOptionValue) {
          const applyOptionId = db.applyOptions.map(apply => apply.id).reduce((prev, current) => prev < current ? current : prev, 0) + 1;
          db.applyOptions.push({
            id: applyOptionId,
            apply: applyId,
            optionType: applyOptionType.id,
            optionValue: applyOptionValue.id
          });
        }
      }

      console.dir(db.applyOptions);
    }

    return res(ctx.status(200), ctx.json(<apiif.DepartmentResponseBody>{ message: 'ok' }));
  }),

  rest.post<apiif.DevicesRequestBody, PathParams, apiif.MessageOnlyResponseBody>('/api/devices', (req, res, ctx) => {
    const id = db.devices.map(device => device.id).reduce((prev, current) => prev < current ? current : prev, 0);
    db.devices.push({
      id: id,
      name: req.body.name
    });
    return res(ctx.status(200), ctx.json({
      message: 'ok'
    }));
  }),

  rest.get<DefaultRequestBody, apiif.optionsApplyRequestPathParams, apiif.ApplyOptionsResponseBody>('/api/options/apply/:type', (req, res, ctx) => {
    const applyType = db.applyTypes.find((applyType) => applyType.name === req.params.type);
    if (!applyType) {
      return res(ctx.status(404), ctx.json({ message: 'type not found' }));
    }

    const applyOptionTypes = db.applyOptionTypes.filter((applyOptionType) => applyOptionType.type === applyType.id);
    if (!applyOptionTypes) {
      return res(ctx.status(200), ctx.json({ message: 'ok', type: applyType.name, optionTypes: [] }));
    }

    const result = applyOptionTypes.map((applyOptionType) => {
      return {
        name: applyOptionType.name,
        description: applyOptionType.description,
        options: db.applyOptionTypeValues
          .filter((applyOptionTypeValue) => applyOptionTypeValue.optionType === applyOptionType.id)
          .map((applyOptionTypeValue) => { return { name: applyOptionTypeValue.name || '', description: applyOptionTypeValue.description } })
      };
    });

    return res(ctx.status(200), ctx.json(<apiif.ApplyOptionsResponseBody>{
      message: 'ok',
      optionTypes: result
    }));
  }),


  rest.get<DefaultRequestBody, PathParams, apiif.ApplyResponseBody>('/api/apply', (req, res, ctx) => {

    // ユーザー認証する
    const user = getUserFromTokenHeader(req.headers.get('Authorization'));
    if (!user) {
      return res(ctx.status(401), ctx.json({ message: 'authorization required' }));
    }

    // 表示すべきなのは
    // 1. 自分自身の申請
    // 2. 自分が代理申請した申請
    // 3. 自分が回付ルートに入っている申請
    const applies = db.applies.filter((apply) =>
      (apply.user === user.id) ||
      (apply.appliedUser === user.id) ||
      db.approvalRouteMembers.some((member) => (member.route === apply.route) && (member.user === user.id))
    );

    const filterType = req.url.searchParams.get('filter');

    // 抽出したレスポンスを返す
    const applyResponses = applies.map((apply) => {
      const type = db.applyTypes.find((type) => type.id === apply.type);
      const appliedUser = db.users.find((appliedUser) => (apply.appliedUser ? appliedUser.id === apply.appliedUser : appliedUser.id === user.id));
      //const approveUsers = db.users.filter((approveUser) => db.approvalRouteMembers.some)
      const approvalMembers = db.approvalRouteMembers
        .filter((member) => member.route === apply.route)
        .map((member) => {
          const approveUser = db.users.find((appUser) => appUser.id === member.user);
          const approveRole = db.roles.find((role) => role.id === member.role);
          const approval = db.approvals.find((approve) => (approve.apply === apply.id) && (approve.user === member.user));

          return {
            account: approveUser ? approveUser.account : '',
            name: approveUser ? approveUser.name : '',
            role: {
              name: approveRole ? approveRole.name : '',
              level: approveRole ? approveRole.level : -1
            },
            timestamp: approval ? approval.timestamp.toISOString() : '',
            isApproved: !approval?.rejected
          };
        });
      apply.id

      const applyResponse: apiif.ApplyResponseData =
      {
        id: apply.id,
        timestamp: apply.timestamp.toISOString(),
        type: {
          name: type ? type.name : '',
          description: type ? type.description : '',
        },
        userApplied: {
          account: appliedUser?.account || '',
          name: appliedUser?.name || ''
        },
        userApproves: approvalMembers || [],
        dateFrom: apply.dateFrom.toISOString(),
        dateTo: apply.dateTo ? apply.dateTo.toISOString() : undefined
      };
      return applyResponse;
    });

    return res(ctx.status(200), ctx.json({
      message: 'ok',
      applies: applyResponses
    }));
  }),
]