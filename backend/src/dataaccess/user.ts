import { DatabaseAccess } from '../dataaccess';
import type * as apiif from 'shared/APIInterfaces';
import { hashPassword } from '../verify';

///////////////////////////////////////////////////////////////////////
// ユーザー情報関連
///////////////////////////////////////////////////////////////////////

export async function getUsers(this: DatabaseAccess, params?: {
  byId?: number,
  isAvailable?: boolean,
  byAccounts?: string[],
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
      builder.where('isDevice', false);
      if (params?.byId) {
        builder.where('user.id', params.byId);
      }

      //if (params.isAvailable === false) {
      //  builder.where('user.available', false);
      //}
      //else {
      builder.where('user.available', params?.isAvailable ?? true);
      //}

      if (params?.byAccounts) {
        builder.whereIn('user.account', params.byAccounts);
      }
      if (params?.byName) {
        builder.where('user.name', 'like', `%${params.byName}%`);
      }
      if (params?.byPhonetic) {
        builder.where('user.phonetic', 'like', `%${params.byPhonetic}%`);
      }
      if (params?.bySection) {
        builder.where('section.name', 'like', `%${params.bySection}%`);
      }
      if (params?.byDepartment) {
        builder.where('department.name', 'like', `%${params.byDepartment}%`);
      }
      if (params?.registeredFrom && params?.registeredTo) {
        builder.whereBetween('registeredAt', [params.registeredFrom, params.registeredTo]);
      }
      else if (params?.registeredFrom) {
        builder.where('registeredAt', '>=', params.registeredFrom);
      }
      else if (params?.registeredTo) {
        builder.where('registeredAt', '<=', params.registeredTo);
      }
    })
    .modify(function (builder) {
      if (params?.isQrCodeIssued !== undefined && params?.isQrCodeIssued !== null) {
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
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.registeredAt', 'desc');

  return <RecordResult[]>result;
}

export async function generateAvailableUserAccount(this: DatabaseAccess) {
  const result = await this.knex.select<{ account: string }[]>({ account: 'account' })
    .from('user')
    .where('isDevice', false);

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

export async function addUsers(this: DatabaseAccess, usersInfo: apiif.UserInfoRequestData[]) {

  let departmentId: number = null;
  let sectionId: number = null;

  for (const userInfo of usersInfo) {
    if (userInfo.department) {
      const department = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' })
        .from('department')
        .where('name', userInfo.department)
        .first();

      if (department) {
        departmentId = department.id;

        if (userInfo.section) {
          const section = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' })
            .from('section')
            .where('name', userInfo.section)
            .andWhere('department', departmentId)
            .first();

          if (section) {
            sectionId = section.id;
          }
          else {
            await this.knex('section').insert({ name: userInfo.section, department: departmentId });
            const lastIdResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
            sectionId = lastIdResult['LAST_INSERT_ID()'];
          }
        }
      }
      else {
        await this.knex('department').insert({ name: userInfo.department });
        let lastIdResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
        departmentId = lastIdResult['LAST_INSERT_ID()'];

        await this.knex('section').insert({ name: userInfo.section, department: departmentId });
        lastIdResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
        sectionId = lastIdResult['LAST_INSERT_ID()'];
      }
    }
  }

  const privileges = await this.getPrivileges();
  const workPatterns = await this.getWorkPatterns();

  /*
  await this.knex('user').insert({
    registeredAt: new Date(), account: userInfo.account, name: userInfo.name, email: userInfo.email, phonetic: userInfo.phonetic,
    available: true,
    privilege: privilegeId, section: sectionId,
    defaultWorkPattern: workPatterns.find(workPattern => workPattern.name === userInfo.defaultWorkPatternName)?.id,
    optional1WorkPattern: workPatterns.find(workPattern => workPattern.name === userInfo.optional1WorkPatternName)?.id,
    optional2WorkPattern: workPatterns.find(workPattern => workPattern.name === userInfo.optional2WorkPatternName)?.id,
    password: hashPassword(userInfo.password)
  });
  */

  await this.knex('user').insert(usersInfo.map(userInfo => {
    return {
      registeredAt: new Date(), account: userInfo.account, name: userInfo.name, email: userInfo.email, phonetic: userInfo.phonetic,
      available: true,
      privilege: privileges.find(privilege => privilege.name === userInfo.privilegeName)?.id, section: sectionId,
      defaultWorkPattern: workPatterns.find(workPattern => workPattern.name === userInfo.defaultWorkPatternName)?.id,
      optional1WorkPattern: workPatterns.find(workPattern => workPattern.name === userInfo.optional1WorkPatternName)?.id,
      optional2WorkPattern: workPatterns.find(workPattern => workPattern.name === userInfo.optional2WorkPatternName)?.id,
      password: hashPassword(userInfo.password)
    };
  }));

}

export async function deleteUser(this: DatabaseAccess, account: string) {
  await this.knex('user').del().where('account', account).andWhere('isDevice', false);
}

export async function disableUser(this: DatabaseAccess, account: string) {
  await this.knex('user').update({ available: false }).where('account', account).andWhere('isDevice', false);
}

export async function enableUser(this: DatabaseAccess, account: string) {
  await this.knex('user').update({ available: true }).where('account', account).andWhere('isDevice', false);
}
