import createHttpError from 'http-errors';
import uuidAPIKey from 'uuid-apikey';

import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import { issueJsonWebToken, verifyJsonWebToken, verifyPassword, hashPassword } from '../verify';
import type * as apiif from '../APIInterfaces';

///////////////////////////////////////////////////////////////////////
// 認証関連
///////////////////////////////////////////////////////////////////////

// 通常のトークン期限は1日
export async function issueRefreshToken(this: DatabaseAccess, account: string, password: string, expirationSeconds: number = (60 * 60 * 24)): Promise<apiif.IssueTokenResponseData> {

  // 部門や部署に所属していない可能性があるのでLEFT JOINとする。
  const user = await this.knex.select<{
    id: number, available: boolean, account: string, password: string, name: string, department: string, section: string
  }>({ id: 'user.id', available: 'user.available', account: 'user.account', password: 'user.password', name: 'user.name', department: 'department.name', section: 'section.name' })
    .from('user')
    .leftJoin('section', { 'user.section': 'section.id' })
    .leftJoin('department', { 'section.department': 'department.id' })
    .where('user.account', account)
    .first();

  if (!user) {
    throw new createHttpError.Unauthorized('IDかパスワードが間違っています');
  }

  if (!verifyPassword(user.password, password)) {
    throw new createHttpError.Unauthorized('IDかパスワードが間違っています');
  }

  if (!user?.available) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  // リフレッシュトークンを発行する
  const refreshToken = uuidAPIKey.create({ noDashes: true }).apiKey;

  const dateExpiration = new Date();
  dateExpiration.setSeconds(dateExpiration.getSeconds() + expirationSeconds);

  await this.knex('token').insert({
    user: user.id,
    refreshToken: refreshToken,
    refreshTokenExpiration: dateExpiration,
    isQrToken: false
  });

  return { refreshToken: refreshToken, name: user.name, department: user.department, section: user.section };
}

// QRコード用のトークン期限は10年とする
export async function issueQrCodeRefreshToken(this: DatabaseAccess, account: string, expirationSeconds: number = (60 * 60 * 24 * 3650)): Promise<apiif.IssueTokenResponseData> {

  // 部門や部署に所属していない可能性があるのでLEFT JOINとする。
  const user = await this.knex.select<{
    id: number, available: boolean, account: string, name: string, department: string, section: string
  }>({ id: 'user.id', available: 'user.available', account: 'user.account', name: 'user.name', department: 'department.name', section: 'section.name' })
    .from('user')
    .leftJoin('section', { 'user.section': 'section.id' })
    .leftJoin('department', { 'section.department': 'department.id' })
    .where('user.account', account)
    .first()

  if (!user?.available) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  // リフレッシュトークンを発行する
  const refreshToken = uuidAPIKey.create({ noDashes: true }).apiKey;

  const dateExpiration = new Date();
  dateExpiration.setSeconds(dateExpiration.getSeconds() + expirationSeconds);

  await this.knex('token').insert({
    user: user.id,
    refreshToken: refreshToken,
    refreshTokenExpiration: dateExpiration,
    isQrToken: true
  });

  return { refreshToken: refreshToken, name: user.name, department: user.department, section: user.section };
}

// アクセストークンの期限は30分まで
export async function issueAccessToken(this: DatabaseAccess, refreshToken: string, expirationSeconds: number = (60 * 30)) {
  const tokenData = await this.knex.select<{ userId: number, account: string, refreshToken: string, refreshTokenExpiration: Date }>(
    { userId: 'user.id', account: 'user.account', refreshToken: 'token.refreshToken', refreshTokenExpiration: 'token.refreshTokenExpiration' }
  )
    .from('user')
    .join('token', { 'user.id': 'token.user' })
    .where('token.refreshToken', refreshToken)
    .first();

  if (!tokenData) {
    throw new createHttpError.Unauthorized('ログインが必要です');
  }

  if ((new Date().getTime() > tokenData.refreshTokenExpiration.getTime())) {
    throw new createHttpError.Unauthorized('ログイン期限もしくはQRコードの期限が切れました。再ログインあるいはQRコードの再発行が必要です。');
  }

  return issueJsonWebToken(<UserInfo>{ id: tokenData.userId, account: tokenData.account }, expirationSeconds);
}

export async function getUserInfoFromAccessToken(this: DatabaseAccess, token: string) {
  const userInfo = verifyJsonWebToken(token) as UserInfo;
  if (!userInfo || userInfo.id === undefined || userInfo.account === undefined) {
    throw new Error('access token verification failed.');
  }

  return userInfo;
}

export async function revokeRefreshToken(this: DatabaseAccess, account: string, refreshToken: string) {

  const user = await this.knex.select<{ id: number }>({ id: 'user.id' })
    .from('user')
    .where('user.account', account)
    .first();

  if (!user) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  await this.knex('token')
    .where('user', user.id)
    .andWhere('refreshToken', refreshToken)
    .andWhere('isQrToken', false)
    .del();
}

export async function revokeQrCodeRefreshToken(this: DatabaseAccess, account: string, refreshToken: string) {

  const user = await this.knex.select<{ id: number }>({ id: 'user.id' })
    .from('user')
    .where('user.account', account)
    .first();

  if (!user) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  await this.knex('token')
    .where('user', user.id)
    .andWhere('refreshToken', refreshToken)
    .andWhere('isQrToken', true)
    .del();
}

export async function deleteAllExpiredRefreshTokens(this: DatabaseAccess) {
  const tokenData = await this.knex.select<{ account: string, tokenId: number, refreshToken: string }[]>(
    { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
  )
    .from('token')
    .join('user', { 'user.id': 'token.user' })

  for (const token of tokenData) {
    try {
      //verifier.verifyRefreshToken(token.refreshToken, { account: token.account });
    } catch (error: unknown) {
      if ((error as Error).name === 'TokenExpiredError') {
        await this.knex('token').del().where('id', token.tokenId);
      }
      else {
        throw error;
      }
    }
  }
}

export async function changeUserPassword(this: DatabaseAccess, userInfo: UserInfo, params: apiif.ChangePasswordRequestBody) {
  const userPrivilege = await this.getUserPrivilege(userInfo.account);
  if (params.account && !params.oldPassword) {
    if (!userPrivilege.registerUser) {
      throw new createHttpError.Forbidden('他のユーザーのパスワードを変更する権限がありません');
    }
  }

  const targetUserInfo =
    await this.knex.select<{ id: number, password: string }[]>({ id: 'id', password: 'password' })
      .from('user')
      .where(function (builder) {
        if (params.account) {
          builder.where('account', params.account);
        }
        else {
          builder.where('id', userInfo.id);
        }
      })
      .first();

  if (!targetUserInfo) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  if (params.oldPassword) {
    if (!verifyPassword(targetUserInfo.password, params.oldPassword)) {
      throw new createHttpError.Unauthorized('IDかパスワードが間違っています');
    }
  }

  await this.knex('user').update({
    password: hashPassword(params.newPassword)
  })
    .where('id', targetUserInfo.id);
}
