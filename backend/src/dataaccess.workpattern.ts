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

  // 一旦、対象勤務体系の既存勤務時間帯情報は全て消す
  await this.knex('wagePattern').del().where('workPattern', workPattern.id);

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

export async function deleteWorkPattern(this: DatabaseAccess, accessToken: string, id: number) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  await this.knex('wagePattern').del().where('workPattern', id);
  await this.knex('workPattern').del().where('id', id);
}
