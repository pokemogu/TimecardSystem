import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import * as verifier from '../verify';
import type * as apiif from 'shared/APIInterfaces';
import createHttpError from 'http-errors';

///////////////////////////////////////////////////////////////////////
// 認証関連
///////////////////////////////////////////////////////////////////////

export async function issueRefreshToken(this: DatabaseAccess, account: string, password: string): Promise<apiif.IssueTokenResponseData> {

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

  if (!verifier.verifyPassword(user.password, password)) {
    throw new createHttpError.Unauthorized('IDかパスワードが間違っています');
  }

  if (!user.available) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  // 通常のトークン期限は1日
  const secondsPerDay = 60 * 60 * 24;
  const token = verifier.issueRefreshToken({ id: user.id, account: user.account }, secondsPerDay);
  await this.knex('token').insert({
    user: user.id,
    refreshToken: token,
    isQrToken: false
  });

  return { refreshToken: token, name: user.name, department: user.department, section: user.section };
}

export async function issueQrCodeRefreshToken(this: DatabaseAccess, account: string): Promise<apiif.IssueTokenResponseData> {

  /*
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  const privilege = await this.getUserPrivilege(accessToken, authUserInfo.id);

  // QRコード発行の権限が無い場合はエラー
  if (!privilege.issueQr) {
    const error = new Error('qr code issueing not allowed.');
    error.name = 'PermissionDeniedError';
    throw error;
  }
  */

  // 部門や部署に所属していない可能性があるのでLEFT JOINとする。
  const user = await this.knex.select<{
    id: number, available: boolean, account: string, name: string, department: string, section: string
  }>({ id: 'user.id', available: 'user.available', account: 'user.account', name: 'user.name', department: 'department.name', section: 'section.name' })
    .from('user')
    .leftJoin('section', { 'user.section': 'section.id' })
    .leftJoin('department', { 'section.department': 'department.id' })
    .where('user.account', account)
    .first()

  if (!user.available) {
    throw new createHttpError.NotFound('指定されたユーザーは存在しません');
  }

  // QRコード用のトークン期限は10年とする
  const secondsPerDay = 60 * 60 * 24;
  const refreshToken = verifier.issueRefreshToken({ id: user.id, account: user.account }, secondsPerDay * 3650);
  await this.knex('token').insert({
    user: user.id,
    refreshToken: refreshToken,
    isQrToken: true
  });

  return { refreshToken: refreshToken, name: user.name, department: user.department, section: user.section };
}

export async function issueAccessToken(this: DatabaseAccess, token: string) {
  const tokenData = await this.knex.select<{ userId: number, account: string, tokenId: number, refreshToken: string }>(
    { userId: 'user.id', account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
  )
    .from('user')
    .join('token', { 'user.id': 'token.user' })
    .where('token.refreshToken', token)
    .first();

  if (!tokenData) {
    throw new createHttpError.Unauthorized('ログインが必要です');
  }

  if (!verifier.verifyRefreshToken(token, <UserInfo>{ id: tokenData.userId, account: tokenData.account })) {
    throw new Error('refresh token verification failed.');
  }

  const accessToken = verifier.issueAccessToken(<UserInfo>{ id: tokenData.userId, account: tokenData.account }, 60);
  await this.knex('token').update({
    accessToken: accessToken
  })
    .where('id', tokenData.tokenId)

  return accessToken;
}

export async function getUserInfoFromAccessToken(this: DatabaseAccess, token: string) {
  const userInfo = verifier.verifyAccessToken(token) as UserInfo;
  if (!userInfo || userInfo.id === undefined || userInfo.account === undefined) {
    throw new Error('access token verification failed.');
  }

  return userInfo;
}

export async function revokeRefreshToken(this: DatabaseAccess, account: string, token: string) {

  const user = await this.knex.select<{ id: number }>({ id: 'user.id' })
    .from('user')
    .where('user.account', account)
    .first();

  if (!verifier.verifyRefreshToken(token, <UserInfo>{ id: user.id, account: account })) {
    throw new Error('refresh token verification failed.');
  }

  await this.knex('token').where('user', user.id).andWhere('isQrToken', false).del();
}

export async function deleteAllExpiredRefreshTokens(this: DatabaseAccess) {
  const tokenData = await this.knex.select<{ account: string, tokenId: number, refreshToken: string }[]>(
    { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
  )
    .from('token')
    .join('user', { 'user.id': 'token.user' })

  for (const token of tokenData) {
    try {
      verifier.verifyRefreshToken(token.refreshToken, { account: token.account });
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

  if (!verifier.verifyPassword(targetUserInfo.password, params.oldPassword)) {
    throw new createHttpError.Unauthorized('パスワードが間違っています');
  }

  await this.knex('user').update({
    password: verifier.hashPassword(params.newPassword)
  })
    .where('id', targetUserInfo.id);
}
