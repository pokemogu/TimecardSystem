import lodash from 'lodash';
import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';
import type * as models from 'shared/models';

///////////////////////////////////////////////////////////////////////
// ユーザー情報関連
///////////////////////////////////////////////////////////////////////

export async function getUsers(this: DatabaseAccess, accessToken: string, params: {
  byId?: number,
  isAvailable?: boolean,
  byAccount?: string,
  byName?: string,
  byPhonetic?: string,
  bySection?: string,
  byDepartment?: string,
  registeredFrom?: Date,
  registeredTo?: Date,
  isQrCodeIssued?: boolean,
  limit?: number,
  offset?: number
}) {
  type RecordResult = {
    id: number,
    isAvailable: boolean,
    registeredAt: Date,
    account: string,
    name: string,
    phonetic: string,
    email: string,
    department: string,
    section: string
    privilege: string,
    qrCodeIssuedNum: number,
    defaultWorkPatternName: string,
    optional1WorkPatternName: string,
    optional2WorkPatternName: string
  };
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  const result = await this.knex
    .select<RecordResult[]>
    (
      {
        id: 'user.id', isAvailable: 'user.available', registeredAt: 'user.registeredAt', account: 'user.account', name: 'user.name', email: 'user.email',
        phonetic: 'user.phonetic', department: 'department.name', section: 'section.name', privilege: 'privilege.name',
        defaultWorkPatternName: 'w1.name', optional1WorkPatternName: 'w2.name', optional2WorkPatternName: 'w3.name'
      }
    )
    .sum('token.isQrToken', { as: 'qrCodeIssuedNum' })
    .from('user')
    .leftJoin('section', { 'section.id': 'user.section' })
    .leftJoin('department', { 'department.id': 'section.department' })
    .join('privilege', { 'privilege.id': 'user.privilege' })
    .leftJoin('token', { 'token.user': 'user.id' })
    .leftJoin('workPattern as w1', { 'w1.id': 'user.defaultWorkPattern' })
    .leftJoin('workPattern as w2', { 'w2.id': 'user.optional1WorkPattern' })
    .leftJoin('workPattern as w3', { 'w3.id': 'user.optional2WorkPattern' })
    .where(function (builder) {
      if (params.byId) {
        builder.where('user.id', params.byId);
      }

      if (params.isAvailable === false) {
        builder.where('user.available', false);
      }
      else {
        builder.where('user.available', true);
      }

      if (params.byAccount) {
        builder.where('user.account', params.byAccount);
      }
      if (params.byName) {
        builder.where('user.name', 'like', `%${params.byName}%`);
      }
      if (params.byPhonetic) {
        builder.where('user.phonetic', 'like', `%${params.byPhonetic}%`);
      }
      if (params.bySection) {
        builder.where('section.name', 'like', `%${params.bySection}%`);
      }
      if (params.byDepartment) {
        builder.where('department.name', 'like', `%${params.byDepartment}%`);
      }
      if (params.registeredFrom && params.registeredTo) {
        builder.whereBetween('registeredAt', [params.registeredFrom, params.registeredTo]);
      }
      else if (params.registeredFrom) {
        builder.where('registeredAt', '>=', params.registeredFrom);
      }
      else if (params.registeredTo) {
        builder.where('registeredAt', '<=', params.registeredTo);
      }
    })
    .modify(function (builder) {
      if (params.isQrCodeIssued !== undefined && params.isQrCodeIssued !== null) {
        if (params.isQrCodeIssued.toString() === 'true') {
          builder.having('qrCodeIssuedNum', '>', 0);
        }
        else if (params.isQrCodeIssued.toString() === 'false') {
          builder.havingRaw('qrCodeIssuedNum is null');
          builder.orHaving('qrCodeIssuedNum', '=', 0);
        }
      }
    })
    .groupBy('user.id')
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.registeredAt', 'desc');

  return <RecordResult[]>result;
}

export async function generateAvailableUserAccount(this: DatabaseAccess) {
  const result = await this.knex
    .select<{ account: string }[]>
    (
      { account: 'account' }
    )
    .from('user');

  const users = result as { account: string }[];

  const candidates: { prefix: string, id: number, length: number }[] = [];
  for (const user of users) {
    const account = user.account;
    const matches = account.match(/^(\D+)(\d+)$/);
    if (matches && matches.length > 2) {
      const prefix = matches[1];
      const id = parseInt(matches[2]);
      const length = matches[2].length;

      const index = candidates.findIndex(candidate => candidate.prefix === prefix && candidate.length === length);
      if (index < 0) {
        candidates.push({
          prefix: prefix,
          id: id,
          length: length
        });
      }
      else {
        if (id >= candidates[index].id) {
          candidates[index].id = id + 1;
        }
      }
    }
  }

  return candidates.map(candidate => candidate.prefix + candidate.id.toString().padStart(candidate.length, '0'));
}

export async function registerUser(this: DatabaseAccess, accessToken: string, userData: models.User, password: string, params?: {
  department?: string, section?: string, privilege?: string
}) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  const user = lodash.omit(userData, ['id']);
  //user.password = hashPassword(password);

  if (params) {

  } else {

  }

  await this.knex('user').insert(user);
}

export async function deleteUser(this: DatabaseAccess, idOrAccount: number | string) {

  if (typeof idOrAccount === 'string') {
    await this.knex('user').del().where('account', idOrAccount);
  }
  else {
    await this.knex('user').del().where('id', idOrAccount);
  }
}

export async function disableUser(this: DatabaseAccess, idOrAccount: number | string) {

  if (typeof idOrAccount === 'string') {
    await this.knex('user').update({ available: false }).where('account', idOrAccount);
  }
  else {
    await this.knex('user').update({ available: false }).where('id', idOrAccount);
  }
}
