import { DatabaseAccess } from './dataaccess';
import * as verifier from './verify';
import type * as apiif from 'shared/APIInterfaces';

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
    const error = new Error('password verification failed.');
    error.name = 'AuthenticationError';
    throw error;
  }

  if (!verifier.verifyPassword(user.password, password)) {
    const error = new Error('password verification failed.');
    error.name = 'AuthenticationError';
    throw error;
  }

  if (!user.available) {
    const error = new Error('user is not available.');
    error.name = 'UserNotAvailableError';
    throw error;
  }

  // 通常のトークン期限は1日
  const secondsPerDay = 60 * 60 * 24;
  const token = verifier.issueRefreshToken({ account: account }, secondsPerDay);
  await this.knex('token').insert({
    user: user.id,
    refreshToken: token,
    isQrToken: false
  });

  return { refreshToken: token, name: user.name, department: user.department, section: user.section };
}

export async function issueQrCodeRefreshToken(this: DatabaseAccess, accessToken: string, account: string): Promise<apiif.IssueTokenResponseData> {

  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  const privilege = await this.getUserPrivilege(accessToken, authUserInfo.id);

  // QRコード発行の権限が無い場合はエラー
  if (!privilege.issueQr) {
    const error = new Error('qr code issueing not allowed.');
    error.name = 'PermissionDeniedError';
    throw error;
  }

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
    const error = new Error('user is not available.');
    error.name = 'UserNotAvailableError';
    throw error;
  }

  // QRコード用のトークン期限は10年とする
  const secondsPerDay = 60 * 60 * 24;
  const refreshToken = verifier.issueRefreshToken({ account: account }, secondsPerDay * 3650);
  await this.knex('token').insert({
    user: user.id,
    refreshToken: refreshToken,
    isQrToken: true
  });

  return { refreshToken: refreshToken, name: user.name, department: user.department, section: user.section };
}

export async function issueAccessToken(this: DatabaseAccess, token: string) {
  const tokenData = await this.knex.select<{ account: string, tokenId: number, refreshToken: string }>(
    { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
  )
    .from('user')
    .join('token', { 'user.id': 'token.user' })
    .where('token.refreshToken', token)
    .first();

  if (!tokenData) {
    const error = new Error('refresh token does not exist.');
    error.name = 'AuthenticationError';
    throw error;
  }

  if (!verifier.verifyRefreshToken(token, { account: tokenData.account })) {
    throw new Error('refresh token verification failed.');
  }

  const accessToken = verifier.issueAccessToken({ account: tokenData.account }, 60);
  await this.knex('token').update({
    accessToken: accessToken
  })
    .where('id', tokenData.tokenId)

  return accessToken;
}

export async function getUserInfoFromAccessToken(this: DatabaseAccess, token: string): Promise<{
  id: number,
  account: string,
  section: number,
  email: string,
  phonetic: string,
  privilege: number
}> {
  const userData = await this.knex.select<{ id: number, account: string, section: number, email: string, phonetic: string, privilege: number }>(
    { id: 'user.id', account: 'user.account', section: 'user.section', email: 'user.email', phonetic: 'user.phonetic', privilege: 'user.privilege' }
  )
    .from('user')
    .join('token', { 'user.id': 'token.user' })
    .where('token.accessToken', token)
    .first();

  if (!userData) {
    throw new Error('access token does not exist');
  }

  if (!verifier.verifyAccessToken(token, { account: userData.account })) {
    throw new Error('access token verification failed.');
  }

  return userData;
}

export async function revokeRefreshToken(this: DatabaseAccess, account: string, token: string) {
  if (!verifier.verifyRefreshToken(token, { account: account })) {
    throw new Error('refresh token verification failed.');
  }

  const user = await this.knex.select<{ id: number }>({ id: 'user.id' })
    .from('user')
    .where('user.account', account)
    .first();

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

export async function changeUserPassword(this: DatabaseAccess, accessToken: string, params: {
  account?: string, oldPassword: string, newPassword: string
}) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  const targetUserInfo =
    await this.knex.select<{ id: number, password: string }[]>({ id: 'id', password: 'password' })
      .from('user')
      .where(function (builder) {
        if (params.account) {
          builder.where('account', params.account);
        }
        else {
          builder.where('id', authUserInfo.id);
        }
      })
      .first();

  if (!verifier.verifyPassword(targetUserInfo.password, params.oldPassword)) {
    const error = new Error('password verification failed.');
    error.name = 'AuthenticationError';
    throw error;
  }

  await this.knex('user').update({
    password: verifier.hashPassword(params.newPassword)
  })
    .where('id', targetUserInfo.id);
}
