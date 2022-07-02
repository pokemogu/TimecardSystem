import createHttpError from 'http-errors';

import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

function dateToStr(date: Date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

function strToDate(dateStr: string) {
  const elems = dateStr.split(/[\-\/]/, 3);
  if (elems.length === 3) {
    return new Date(parseInt(elems[0]), parseInt(elems[1]) - 1, parseInt(elems[2]));
  }
  else {
    return new Date();
  }
}

function timeToMinutes(time: string) {
  const hourMin = time.split(':', 2).map(num => parseInt(num));
  if (hourMin.length > 1) {
    return (hourMin[0] * 60) + hourMin[1];
  } else {
    return 0;
  }
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remain_minutes = minutes % 60;

  return hours.toString().padStart(2, '0') + ':' + remain_minutes.toString().padStart(2, '0');
}

function getTimeAddedDate(date: Date, timeStr: string) {
  const dateNew = new Date(date);
  dateNew.setMinutes(dateNew.getMinutes() + timeToMinutes(timeStr));

  return dateNew;
}

function getStartEndTimeDate(date: Date, startTimeStr: string | null, endTimeStr: string | null, leaveRate?: number): [Date | null, Date | null] {
  if (startTimeStr === null || endTimeStr === null) {
    return [null, null];
  }
  if (!leaveRate) {
    return [getTimeAddedDate(date, startTimeStr), getTimeAddedDate(date, endTimeStr)];
  }

  let startTimeMin = timeToMinutes(startTimeStr);
  let endTimeMin = timeToMinutes(endTimeStr);
  const timeMin = (endTimeMin - startTimeMin) * Math.abs(leaveRate);

  if (leaveRate < 0) {
    endTimeMin -= timeMin;
  }
  else {
    startTimeMin += timeMin;
  }

  return [getTimeAddedDate(date, minutesToTime(startTimeMin)), getTimeAddedDate(date, minutesToTime(endTimeMin))];
}

///////////////////////////////////////////////////////////////////////
// 勤務体系
///////////////////////////////////////////////////////////////////////

export async function addWorkPattern(this: DatabaseAccess, workPattern: apiif.WorkPatternRequestData) {
  await this.knex('workPattern').insert({
    name: workPattern.name,
    onTimeStart: workPattern.onTimeStart,
    onTimeEnd: workPattern.onTimeEnd
  });

  const workPatternId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('workPattern').where('name', workPattern.name).first())?.id;
  if (!workPatternId) {
    throw new createHttpError.NotFound(`指定された勤務体系 ${workPattern.name} が見つかりません`);
  }

  // 勤務時間帯情報を追加する
  const wagePatterns: {
    workPattern: number, name: string, timeStart: string, timeEnd: string,
    normalWagePercentage: number, holidayWagePercentage: number
  }[] = [];

  if (workPattern.wagePatterns && workPattern.wagePatterns.length > 0) {
    for (const pattern of workPattern.wagePatterns) {
      wagePatterns.push({
        workPattern: workPatternId, name: pattern.name, timeStart: pattern.timeStart, timeEnd: pattern.timeEnd,
        normalWagePercentage: pattern.normalWagePercentage, holidayWagePercentage: pattern.holidayWagePercentage
      });
    }
  }

  if (wagePatterns.length > 0) {
    await this.knex('wagePattern').insert(wagePatterns);
  }
}

export async function getWorkPatterns(this: DatabaseAccess, params?: { limit: number, offset: number }) {
  return await this.knex
    .select<apiif.WorkPatternResponseData[]>
    (
      { id: 'workPattern.id' }, { name: 'workPattern.name' }, { onTimeStart: 'onTimeStart' }, { onTimeEnd: 'onTimeEnd' }
    )
    .from('workPattern')
    .modify(function (builder) {
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
        builder.offset(params.offset);
      }
    }) as apiif.WorkPatternResponseData[];
}

export async function getWorkPattern(this: DatabaseAccess, idOrName: number | string, params?: { limit: number, offset: number }) {
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
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
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

export async function updateWorkPattern(this: DatabaseAccess, workPattern: apiif.WorkPatternRequestData) {

  await this.knex('workPattern')
    .where('id', workPattern.id)
    .update({
      name: workPattern.name,
      onTimeStart: workPattern.onTimeStart,
      onTimeEnd: workPattern.onTimeEnd
    });

  const workPatternId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('workPattern').where('name', workPattern.name).first())?.id;
  if (!workPatternId) {
    throw new createHttpError.NotFound(`指定された勤務体系 ${workPattern.name} が見つかりません`);
  }

  // 勤務時間帯情報を追加する
  const wagePatterns: {
    workPattern: number, name: string, timeStart: string, timeEnd: string,
    normalWagePercentage: number, holidayWagePercentage: number
  }[] = [];

  if (workPattern.wagePatterns && workPattern.wagePatterns.length > 0) {
    for (const pattern of workPattern.wagePatterns) {
      wagePatterns.push({
        workPattern: workPatternId, name: pattern.name, timeStart: pattern.timeStart, timeEnd: pattern.timeEnd,
        normalWagePercentage: pattern.normalWagePercentage, holidayWagePercentage: pattern.holidayWagePercentage
      });
    }
  }

  if (wagePatterns.length > 0) {
    await this.knex.transaction(async (trx) => {
      // 一旦、対象勤務体系の既存勤務時間帯情報は全て消す
      await this.knex('wagePattern').del().where('workPattern', workPattern.id).transacting(trx);
      await this.knex('wagePattern').insert(wagePatterns).transacting(trx);
    });
  }
}

export async function deleteWorkPattern(this: DatabaseAccess, id: number) {
  try {
    await this.knex.transaction(async (trx) => {
      await this.knex('wagePattern').del().where('workPattern', id);
      await this.knex('workPattern').del().where('id', id);
    });
  }
  catch (error: unknown) {
    if (error instanceof Error && error.toString().includes('foreign key constraint fails')) {
      throw createHttpError(403, 'この勤務体系を使用しているユーザーがいる為、削除できません', { internalMessage: (error as Error).message });
    }
    else {
      throw error;
    }
  }
}

///////////////////////////////////////////////////////////////////////
// 勤務体系カレンダー
///////////////////////////////////////////////////////////////////////

export async function setUserWorkPatternCalendar(this: DatabaseAccess, userInfo: UserInfo, workPatternCalendar: apiif.UserWorkPatternCalendarRequestData) {
  let userId = userInfo.id;
  if (workPatternCalendar.account) {
    const paramUserInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', workPatternCalendar.account).first();
    if (paramUserInfo) {
      userId = userInfo.id;
    }
  }

  let workPatternId: number | null = null;
  if (workPatternCalendar.name !== null) {
    const workPatternResult = await this.knex.select<{ id: number }[]>({ id: 'id' })
      .from('workPattern')
      .where('name', workPatternCalendar.name)
      .first();

    if (!workPatternResult) {
      throw new createHttpError.NotFound(`指定された勤務体系 ${workPatternCalendar.name} が見つかりません`);
    }
    else {
      workPatternId = workPatternResult.id;
    }
  }
  await this.knex('userWorkPatternCalendar').insert({ user: userId, date: new Date(workPatternCalendar.date), workPattern: workPatternId })
    .onConflict(['user', 'date']).merge(['workPattern']); // ON DUPLICATE KEY UPDATE
}

export async function getUserWorkPatternCalendar(this: DatabaseAccess, userInfo: UserInfo, params?: apiif.UserWorkPatternCalendarRequestQuery) {
  type RecordUserWorkPatternCalendar = {
    id: number, date: string, userId: number,
    workPatternId: number, workPatternName: string, workPatternOnTimeStart: string, workPatternOnTimeEnd: string,
    workPatternLeaveRate: number
  };

  const results = await this.knex.select<RecordUserWorkPatternCalendar[]>({
    id: 'userWorkPatternCalendar.id', date: 'userWorkPatternCalendar.date', userId: 'user.id',
    workPatternId: 'workPattern.id', workPatternName: 'workPattern.name', workPatternOnTimeStart: 'workPattern.onTimeStart', workPatternOnTimeEnd: 'workPattern.onTimeEnd',
    workPatternLeaveRate: 'userWorkPatternCalendar.leaveRate'
  })
    .from('userWorkPatternCalendar')
    .join('user', { 'user.id': 'userWorkPatternCalendar.user' })
    .leftJoin('workPattern', { 'workPattern.id': 'userWorkPatternCalendar.workPattern' })
    .where(function (builder) {
      if (params?.from && params?.to) {
        builder.whereBetween('date', [params.from, params.to]);
      }
      else if (params?.from) {
        builder.where('date', '>=', params.from);
      }
      else if (params?.to) {
        builder.where('date', '<=', params.to);
      }

      if (params?.accounts) {
        builder.whereIn('user.account', params.accounts);
      }
      else {
        builder.where('user.id', userInfo.id);
      }
    })
    .modify(function (builder) {
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.id', 'asc')
    .orderBy('userWorkPatternCalendar.date', 'asc') as RecordUserWorkPatternCalendar[];

  const userNonDefaultWorkPatterns = <apiif.UserWorkPatternCalendarResponseData[]>results.map((result) => {
    const date = new Date(result.date);
    const [onDateTimeStart, onDateTimeEnd] = getStartEndTimeDate(
      date, result.workPatternOnTimeStart, result.workPatternOnTimeEnd, result.workPatternLeaveRate
    );

    return {
      id: result.id,
      date: dateToStr(date),
      user: {
        id: result.userId
      },
      workPattern: result.workPatternId ? {
        id: result.workPatternId,
        name: result.workPatternName,
        onDateTimeStart: onDateTimeStart!.toISOString(),
        onDateTimeEnd: onDateTimeEnd!.toISOString()
      } : null
    }
  });

  // 日付範囲指定が無い場合は、抽出した勤務体系設定日をそのまま返す
  // つまり勤務体系が設定されていない日(デフォルト扱いの日)の情報は返さない
  if (!params?.from || !params?.to) {
    return userNonDefaultWorkPatterns;
  }

  // 日付範囲指定がある場合は、勤務体系設定が無い日でも、
  // デフォルト設定の勤務体系(平日は勤務体系1、休日は勤務なし)を返す
  const users = await this.getUsersInfo({ accounts: params.accounts ?? [userInfo.account] });
  const holidays = await this.getHolidays({ from: params.from, to: params.to });
  const workPatterns = await this.getWorkPatterns();

  const userWorkPatterns: apiif.UserWorkPatternCalendarResponseData[] = [];
  const dateFrom = strToDate(params.from);
  const dateTo = strToDate(params.to);

  for (const user of users) {
    const userDefaultWorkPattern = workPatterns.find(workPattern => workPattern.name === user.defaultWorkPatternName);
    if (!userDefaultWorkPattern) {
      continue;
    }
    for (const date = new Date(dateFrom); date.getTime() <= dateTo.getTime(); date.setDate(date.getDate() + 1)) {
      const dateStr = dateToStr(date);
      const userWorkPattern = userNonDefaultWorkPatterns.find(workPattern => workPattern.user.id === user.id && workPattern.date === dateStr);
      const isHoliday = date.getDay() === 0 || date.getDay() === 6 || holidays.some(holiday => dateToStr(new Date(holiday.date)) === dateStr);

      const [onDateTimeStart, onDateTimeEnd] = getStartEndTimeDate(
        date, userDefaultWorkPattern.onTimeStart, userDefaultWorkPattern.onTimeEnd
      );

      userWorkPatterns.push({
        date: dateToStr(date),
        user: { ...user },
        workPattern: userWorkPattern?.workPattern !== undefined ? userWorkPattern?.workPattern : (isHoliday ? null : {
          id: userDefaultWorkPattern.id,
          name: userDefaultWorkPattern.name,
          onDateTimeStart: onDateTimeStart!.toISOString(),
          onDateTimeEnd: onDateTimeEnd!.toISOString()
        })
      });
    }
  }

  return userWorkPatterns;
}

export async function deleteUserWorkPatternCalendar(this: DatabaseAccess, userInfo: UserInfo, date: string, account?: string) {
  let userId = userInfo.id;
  if (account) {
    const paramUserInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', account).first();
    if (paramUserInfo) {
      userId = paramUserInfo.id;
    }
  }

  await this.knex('userWorkPatternCalendar').where('date', date).andWhere('user', userId).del();
}
