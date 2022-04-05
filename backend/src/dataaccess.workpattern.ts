import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';

///////////////////////////////////////////////////////////////////////
// 勤務体系
///////////////////////////////////////////////////////////////////////

export async function addWorkPattern(this: DatabaseAccess, accessToken: string, workPattern: apiif.WorkPatternRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  await this.knex('workPattern').insert({
    name: workPattern.name,
    onTimeStart: workPattern.onTimeStart,
    onTimeEnd: workPattern.onTimeEnd
  });

  const workPatternId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('workPattern').where('name', workPattern.name).first()).id;

  // 勤務時間帯情報を追加する
  const wagePatterns: {
    workPattern: number, name: string, timeStart: string, timeEnd: string,
    normalWagePercentage: number, holidayWagePercentage: number
  }[] = [];
  for (const pattern of workPattern.wagePatterns) {
    wagePatterns.push({
      workPattern: workPatternId, name: pattern.name, timeStart: pattern.timeStart, timeEnd: pattern.timeEnd,
      normalWagePercentage: pattern.normalWagePercentage, holidayWagePercentage: pattern.holidayWagePercentage
    });
  }

  if (wagePatterns.length > 0) {
    await this.knex('wagePattern').insert(wagePatterns);
  }
}

export async function getWorkPatterns(this: DatabaseAccess, accessToken: string, params?: { limit: number, offset: number }) {
  const userInfo = await this.getUserInfoFromAccessToken(accessToken);

  return await this.knex
    .select<apiif.WorkPatternsResponseData[]>
    (
      { id: 'workPattern.id' }, { name: 'workPattern.name' }, { onTimeStart: 'onTimeStart' }, { onTimeEnd: 'onTimeEnd' }
    )
    .from('workPattern')
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    }) as apiif.WorkPatternsResponseData[];
}

export async function getWorkPattern(this: DatabaseAccess, accessToken: string, idOrName: number | string, params?: { limit: number, offset: number }) {
  const userInfo = await this.getUserInfoFromAccessToken(accessToken);

  const workPatternResult = await this.knex
    .select<{
      id: number, name: string, onTimeStart: string, onTimeEnd: string,
    }[]>
    (
      { id: 'id' }, { name: 'name' }, { onTimeStart: 'onTimeStart' }, { onTimeEnd: 'onTimeEnd' }
    )
    .from('workPattern')
    .where(function (builder) {
      if (typeof idOrName === 'string') {
        builder.where('workPattern.name', idOrName);
      }
      else {
        builder.where('workPattern.id', idOrName);
      }
    })
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    })
    .first();

  const wagePatternResult = await this.knex
    .select<{
      id: number, name: string, timeStart: string, timeEnd: string,
      normalWagePercentage: number, holidayWagePercentage: number
    }[]>
    (
      { id: 'id' }, { name: 'name' }, { timeStart: 'timeStart' }, { timeEnd: 'timeEnd' },
      { normalWagePercentage: 'normalWagePercentage' }, { holidayWagePercentage: 'holidayWagePercentage' }
    )
    .from('wagePattern')
    .where('workPattern', workPatternResult.id);

  return <apiif.WorkPatternResponseData>{
    id: workPatternResult.id,
    name: workPatternResult.name,
    onTimeStart: workPatternResult.onTimeStart,
    onTimeEnd: workPatternResult.onTimeEnd,
    wagePatterns: wagePatternResult
  };
}

export async function updateWorkPattern(this: DatabaseAccess, accessToken: string, workPattern: apiif.WorkPatternRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  await this.knex('workPattern')
    .where('id', workPattern.id)
    .update({
      name: workPattern.name,
      onTimeStart: workPattern.onTimeStart,
      onTimeEnd: workPattern.onTimeEnd
    });

  const workPatternId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('workPattern').where('name', workPattern.name).first()).id;


  // 勤務時間帯情報を追加する
  const wagePatterns: {
    workPattern: number, name: string, timeStart: string, timeEnd: string,
    normalWagePercentage: number, holidayWagePercentage: number
  }[] = [];
  for (const pattern of workPattern.wagePatterns) {
    wagePatterns.push({
      workPattern: workPatternId, name: pattern.name, timeStart: pattern.timeStart, timeEnd: pattern.timeEnd,
      normalWagePercentage: pattern.normalWagePercentage, holidayWagePercentage: pattern.holidayWagePercentage
    });
  }

  if (wagePatterns.length > 0) {
    await this.knex.transaction(async (trx) => {
      // 一旦、対象勤務体系の既存勤務時間帯情報は全て消す
      await this.knex('wagePattern').del().where('workPattern', workPattern.id).transacting(trx);
      await this.knex('wagePattern').insert(wagePatterns).transacting(trx);
    });
  }
}

export async function deleteWorkPattern(this: DatabaseAccess, accessToken: string, id: number) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  await this.knex.transaction(async (trx) => {
    await this.knex('wagePattern').del().where('workPattern', id);
    await this.knex('workPattern').del().where('id', id);
  });
}

export async function setUserWorkPatternCalendar(this: DatabaseAccess, accessToken: string, workPatternCalendar: apiif.UserWorkPatternCalendarRequestData) {
  let userId = 0;
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  if (workPatternCalendar.account) {
    const userInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', workPatternCalendar.account).first();
    userId = userInfo.id;
  }
  else {
    userId = authUserInfo.id;
  }

  let workPatternId: number | null = null;
  if (workPatternCalendar.name !== null) {
    const workPatternResult = await this.knex.select<{ id: number }[]>({ id: 'id' })
      .from('workPattern')
      .where('name', workPatternCalendar.name)
      .first();
    workPatternId = workPatternResult.id;
  }
  await this.knex('userWorkPatternCalendar').insert({ user: userId, date: new Date(workPatternCalendar.date), workPattern: workPatternId })
    .onConflict(['user', 'date']).merge(['workPattern']); // ON DUPLICATE KEY UPDATE
}

export async function getUserWorkPatternCalendar(this: DatabaseAccess, accessToken: string, params?: apiif.UserWorkPatternCalendarRequestQuery) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  type RecordUserWorkPatternCalendar = {
    id: number, date: string,
    userId: number, userAccount: string, userName: string,
    workPatternId: number, workPatternName: string, workPatternOnTimeStart: string, workPatternOnTimeEnd: string
  };

  const results = await this.knex.select<RecordUserWorkPatternCalendar[]>({
    id: 'userWorkPatternCalendar.id', date: 'userWorkPatternCalendar.date',
    userId: 'user.id', userAccount: 'user.account', userName: 'user.name',
    workPatternId: 'workPattern.id', workPatternName: 'workPattern.name', workPatternOnTimeStart: 'workPattern.onTimeStart', workPatternOnTimeEnd: 'workPattern.onTimeEnd'
  })
    .from('userWorkPatternCalendar')
    .join('user', { 'user.id': 'userWorkPatternCalendar.user' })
    .leftJoin('workPattern', { 'workPattern.id': 'userWorkPatternCalendar.workPattern' })
    .where(function (builder) {
      if (params.from && params.to) {
        builder.whereBetween('date', [params.from, params.to]);
      }
      else if (params.from) {
        builder.where('date', '>=', params.from);
      }
      else if (params.to) {
        builder.where('date', '<=', params.to);
      }

      if (params.account) {
        builder.where('user.account', params.account);
      }
      else {
        builder.where('user.id', authUserInfo.id);
      }
    })
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.id', 'asc')
    .orderBy('userWorkPatternCalendar.date', 'asc') as RecordUserWorkPatternCalendar[];

  return <apiif.UserWorkPatternCalendarResponseData[]>results.map((result) => {
    return {
      id: result.id,
      date: result.date,
      user: {
        id: result.userId,
        account: result.userAccount,
        name: result.userName
      },
      workPattern: {
        id: result.workPatternId,
        name: result.workPatternName,
        onTimeStart: result.workPatternOnTimeStart,
        onTimeEnd: result.workPatternOnTimeEnd
      }
    }
  })
}

export async function deleteUserWorkPatternCalendar(this: DatabaseAccess, accessToken: string, date: string, account?: string) {
  let userId = 0;
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  if (account) {
    const userInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', account).first();
    userId = userInfo.id;
  }
  else {
    userId = authUserInfo.id;
  }

  await this.knex('userWorkPatternCalendar').where('date', date).andWhere('user', userId).del();
}
