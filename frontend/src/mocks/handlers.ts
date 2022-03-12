import { rest } from 'msw'
import type { DefaultRequestBody, PathParams } from 'msw'

import * as db from './db'

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

interface issueTokenRequestBody {
  userId: string,
  userPassword: string
}

interface issueTokenResponseBody {
  message: string,
  accessToken?: string,
  refreshToken?: string
}

type userRequestPathParams = Record<'userId', string>;

interface refreshTokenRequestBody {
  refreshToken: string
}

interface refreshTokenResponseBody {
  message: string,
  accessToken?: string,
}

interface revokeTokenRequestBody {
  userId: string,
  refreshToken: string
}

interface revokeTokenResponseBody {
  message: string
}

interface userInfoResponseBody {
  message: string,
  id?: string,
  name?: string,
  phonetic?: string,
  email?: string,
  section?: string,
  department?: string
}

interface devicesResponseBody {
  message: string,
  devices:
  {
    name: string
  }[]
}

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
  rest.post<issueTokenRequestBody, PathParams, issueTokenResponseBody>('/api/token/issue', (req, res, ctx) => {

    const user = db.users.find((user) => user.account === req.body.userId);
    if (!user || !user.available || user.password !== req.body.userPassword) {
      return res(ctx.status(401), ctx.json({ message: 'authorization failed' }));
    }

    const nowMilliSec = Date.now();
    const refreshToken = generateDummyToken();
    const refreshTokenExpiration = nowMilliSec + (1000 * 60 * 60);

    const id = db.tokens.map(token => token.id).reduce((prev, current) => prev < current ? current : prev, 0);

    db.tokens.push({
      id: id,
      user: user.id,
      refreshToken: refreshToken,
      refreshTokenExpiration: refreshTokenExpiration,
      isQrToken: false
    });

    return res(ctx.status(200), ctx.json({
      message: 'ok',
      userId: user.account,
      userName: user.name,
      refreshToken: refreshToken
    }));
  }),

  rest.post<refreshTokenRequestBody, PathParams, refreshTokenResponseBody>('/api/token/refresh', (req, res, ctx) => {

    const token = db.tokens.find((token) => token.refreshToken === req.body.refreshToken);
    if (!token) {
      return res(ctx.status(401), ctx.json({ message: 'refresh token not issued' }));
    }

    const nowMilliSec = Date.now();

    if (token.refreshTokenExpiration < nowMilliSec) {
      return res(ctx.status(401), ctx.json({ message: 'refresh token expired' }));
    }

    token.accessToken = generateDummyToken();
    token.accessTokenExpiration = nowMilliSec + (1000 * 60 * 1);

    return res(ctx.status(200), ctx.json({
      message: 'ok',
      accessToken: token.accessToken
    }));
  }),

  rest.post<revokeTokenRequestBody, PathParams, revokeTokenResponseBody>('/api/token/revoke', (req, res, ctx) => {
    const nowMilliSec = Date.now();
    const tokenIndex = db.tokens.findIndex((token) => token.refreshToken === req.body.refreshToken);
    const user = db.users.find((user) => user.account === req.body.userId);

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

  rest.get<DefaultRequestBody, userRequestPathParams, userInfoResponseBody>('/api/user/:userId', (req, res, ctx) => {

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
      else if (privilege.viewDepartmentUserInfo && authorizedUser.department === targetUser.department) {
        isPermitted = true;
      }
      // 自部署の全てのユーザー情報を取得する権限がある
      else if (privilege.viewSectionUserInfo && authorizedUser.section === targetUser.section) {
        isPermitted = true;
      }
    }

    // 自分のユーザー情報を取得する
    if (isPermitted) {
      return res(ctx.status(200), ctx.json({
        message: 'ok',
        id: targetUser.account,
        name: targetUser.name,
        phonetic: targetUser.phonetic,
        email: targetUser.email,
        section: db.sections.find(section => section.id === targetUser.section)?.name ?? undefined,
        department: db.departments.find(department => department.id === targetUser.department)?.name ?? undefined
      }));
    }
    else {
      return res(ctx.status(403), ctx.json({ message: 'do not have enough privilege' }));
    }
  }),

  rest.get<DefaultRequestBody, PathParams, devicesResponseBody>('/api/devices', (req, res, ctx) => {
    const devices = db.devices.map((device) => { return { name: device.name } });
    return res(ctx.status(200), ctx.json({
      message: 'ok',
      devices: devices
    }));
  })
]