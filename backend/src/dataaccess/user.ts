import createHttpError from 'http-errors';

import { DatabaseAccess } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

///////////////////////////////////////////////////////////////////////
// ユーザー情報関連
///////////////////////////////////////////////////////////////////////

export async function getUsersInfo(this: DatabaseAccess, params?: apiif.UserInfoRequestQuery) {

  const results = await this.knex
    .select<apiif.UserInfoResponseData[]>
    ({
      id: 'user.id', registeredAt: 'user.registeredAt', account: 'user.account', name: 'user.name', email: 'user.email',
      phonetic: 'user.phonetic', department: 'department.name', section: 'section.name', privilegeName: 'privilege.name',
      defaultWorkPatternName: 'w1.name', optional1WorkPatternName: 'w2.name', optional2WorkPatternName: 'w3.name'//, qrCodeIssuedNum: 'qrCodeIssuedNum'
    })
    .sum('token.isQrToken', { as: 'qrCodeIssueNum' })
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
      if (params?.id) {
        builder.where('user.id', params.id);
      }

      //if (params.isAvailable === false) {
      //  builder.where('user.available', false);
      //}
      //else {
      builder.where('user.available', true);
      //}

      if (params?.accounts) {
        builder.whereIn('user.account', params.accounts);
      }
      if (params?.name) {
        builder.where('user.name', 'like', `%${params.name}%`);
      }
      if (params?.phonetic) {
        builder.where('user.phonetic', 'like', `%${params.phonetic}%`);
      }
      if (params?.section) {
        builder.where('section.name', 'like', `%${params.section}%`);
      }
      if (params?.department) {
        builder.where('department.name', 'like', `%${params.department}%`);
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
    .modify<any, apiif.UserInfoResponseData[]>(function (builder) {
      if (params?.isQrCodeIssued !== undefined && params?.isQrCodeIssued !== null) {
        if (params.isQrCodeIssued === true) {
          builder.having('qrCodeIssueNum', '>', 0);
        }
        else if (params.isQrCodeIssued === false) {
          builder.havingRaw('qrCodeIssueNum is null');
          builder.orHaving('qrCodeIssueNum', '=', 0);
        }
      }
    })
    .groupBy('user.id')
    .modify<any, apiif.UserInfoResponseData[]>(function (builder) {
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.registeredAt', 'desc');

  // Knex(かmysql2ドライバ)のsumはnumberではなくstringで結果を返してくるのでstringからnumberに変換する
  for (const result of results) {
    if (result.qrCodeIssueNum && typeof result.qrCodeIssueNum === 'string') {
      result.qrCodeIssueNum = parseInt(result.qrCodeIssueNum);
    }
  }

  return results;
}

export async function getUserInfoById(this: DatabaseAccess, id: number) {
  const usersInfo = await this.getUsersInfo({ id: id });
  if (!usersInfo || usersInfo.length < 1) {
    throw new createHttpError.NotFound('指定されたIDのユーザーが見つかりません');
  }
  else {
    return usersInfo[0];
  }
}

export async function getUserInfoByAccount(this: DatabaseAccess, account: string) {
  const usersInfo = await this.getUsersInfo({ accounts: [account] });
  if (!usersInfo || usersInfo.length < 1) {
    throw new createHttpError.NotFound('指定されたIDのユーザーが見つかりません');
  }
  else {
    return usersInfo[0];
  }
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

  // 指定された部署名および部門名が存在しない場合は新規にデータベースに登録する。
  // 存在する場合はその情報を取得する。
  const sectionIdForAccount: Record<string, number | null> = {};
  for (const userInfo of usersInfo) {
    let departmentId: number | null = null;
    let sectionId: number | null = null;

    if (!userInfo.account.match(/^[\w\-\.]+$/)) {
      throw new createHttpError.BadRequest(`IDに半角英数字以外が含まれています: ${userInfo.account}`);
    }

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
            if (!lastIdResult) {
              throw createHttpError(500, '', { internalMessage: 'MySQLの LAST_INSERT_ID() 実行に失敗しました' });
            }
            sectionId = lastIdResult['LAST_INSERT_ID()'];
          }
        }
      }
      else {
        await this.knex('department').insert({ name: userInfo.department });
        let lastIdResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
        if (!lastIdResult) {
          throw createHttpError(500, '', { internalMessage: 'MySQLの LAST_INSERT_ID() 実行に失敗しました' });
        }
        departmentId = lastIdResult['LAST_INSERT_ID()'];

        await this.knex('section').insert({ name: userInfo.section, department: departmentId });
        lastIdResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
        if (!lastIdResult) {
          throw createHttpError(500, '', { internalMessage: 'MySQLの LAST_INSERT_ID() 実行に失敗しました' });
        }
        sectionId = lastIdResult['LAST_INSERT_ID()'];
      }
    }
    sectionIdForAccount[userInfo.account] = sectionId;
  }

  const privileges = await this.getPrivileges();
  const workPatterns = await this.getWorkPatterns();

  await this.knex('user').insert(usersInfo.map(userInfo => {
    const privilegeId = privileges.find(privilege => privilege.name === userInfo.privilegeName)?.id;
    if (!privilegeId) {
      throw new createHttpError.NotFound(`指定された権限 ${userInfo.privilegeName} が見つかりません。`);
    }
    const defaultWorkPatternId = workPatterns.find(workPattern => workPattern.name === userInfo.defaultWorkPatternName)?.id;
    if (!defaultWorkPatternId) {
      throw new createHttpError.NotFound(`指定された勤務体系1 ${userInfo.defaultWorkPatternName} が見つかりません。`);
    }

    const optional1WorkPatternId = workPatterns.find(workPattern => workPattern.name === userInfo.optional1WorkPatternName)?.id;
    if (userInfo.optional1WorkPatternName && !optional1WorkPatternId) {
      throw new createHttpError.NotFound(`指定された勤務体系2 ${userInfo.optional1WorkPatternName} が見つかりません。`);
    }
    const optional2WorkPatternId = workPatterns.find(workPattern => workPattern.name === userInfo.optional2WorkPatternName)?.id;
    if (userInfo.optional2WorkPatternName && !optional2WorkPatternId) {
      throw new createHttpError.NotFound(`指定された勤務体系3 ${userInfo.optional2WorkPatternName} が見つかりません。`);
    }

    return {
      registeredAt: new Date(), account: userInfo.account, name: userInfo.name, email: userInfo.email, phonetic: userInfo.phonetic,
      available: true,
      privilege: privilegeId, section: sectionIdForAccount[userInfo.account],
      defaultWorkPattern: defaultWorkPatternId,
      optional1WorkPattern: optional1WorkPatternId,
      optional2WorkPattern: optional2WorkPatternId
    };
  }))
    .onConflict('account')
    .merge(['name', 'email', 'phonetic', 'privilege', 'section', 'defaultWorkPattern', 'optional1WorkPattern', 'optional2WorkPattern']);
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
