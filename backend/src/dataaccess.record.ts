import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';

function dateToLocalString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`;
}

///////////////////////////////////////////////////////////////////////
// 打刻情報関連
///////////////////////////////////////////////////////////////////////

export async function putRecord(this: DatabaseAccess, accessToken: string, params: {
  account?: string, type: string, timestamp: Date, device?: string, deviceToken?: string, apply?: number
}) {

  // type はデータベースから取得済のキャッシュを利用する
  if (!(params.type in DatabaseAccess.recordTypeCache)) {
    throw new Error('invalid type');
  }

  const userInfo = await this.getUserInfoFromAccessToken(accessToken);

  let userId = -1;
  if (params.account) {
    userId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', params.account).first()).id;
  }
  else {
    userId = userInfo.id;
  }

  /*
  await this.knex('recordLog').insert([
    {
      user: userId,
      type: DatabaseAccess.recordTypeCache[params.type].id,
      device: params.device,
      timestamp: params.timestamp
    }
  ]);
  const lastRecordLogResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
  const lastRecordLogId = lastRecordLogResult['LAST_INSERT_ID()'];
  */

  // 出勤(clockin)以外の打刻は前日からの日跨ぎ勤務である可能性があるので、
  // (なお労働基準法の規定上、出勤時の日付は必ず勤務日となるので、出勤打刻の場合は前日チェックはしない)
  // 当日の出勤打刻が無い、かつ前日の出勤打刻がある、場合は前日の打刻として記録する
  const currentDayString = dateToLocalString(params.timestamp);
  const beforeDay = new Date(params.timestamp);
  beforeDay.setDate(beforeDay.getDate() - 1);
  const beforeDayString = dateToLocalString(beforeDay);

  let recordDateString = currentDayString;
  if (params.type !== 'clockin') {
    const records = await this.knex.select<{ id: number, date: Date }[]>({ id: 'id', date: 'date' })
      .from('record')
      .where('user', userId)
      .andWhere('clockin', 'is not', null)
      .andWhereBetween('date', [beforeDayString, currentDayString]);

    for (const record of records) {
      console.log(dateToLocalString(record.date));
    }

    if (!records.some(record => dateToLocalString(record.date) === currentDayString)) {
      console.log('record: currentDay not found')
      if (records.some(record => dateToLocalString(record.date) === beforeDayString)) {
        console.log('record: beforeDay found')
        recordDateString = beforeDayString;
      }
    }
  }

  // 打刻機器が指定されている場合は打刻機器IDを取得する
  let deviceId: number | undefined = undefined;
  if (params.device) {
    deviceId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('device').where('name', params.device).first()).id;
  }

  await this.knex('record').insert({
    user: userId,
    date: recordDateString,

    clockin: params.type === 'clockin' ? params.timestamp : undefined,
    clockinDevice: params.type === 'clockin' ? deviceId : undefined,
    clockinApply: params.type === 'clockin' ? params.apply : undefined,

    break: params.type === 'break' ? params.timestamp : undefined,
    breakDevice: params.type === 'break' ? deviceId : undefined,
    breakApply: params.type === 'break' ? params.apply : undefined,

    reenter: params.type === 'reenter' ? params.timestamp : undefined,
    reenterDevice: params.type === 'reenter' ? deviceId : undefined,
    reenterApply: params.type === 'reenter' ? params.apply : undefined,

    clockout: params.type === 'clockout' ? params.timestamp : undefined,
    clockoutDevice: params.type === 'clockout' ? deviceId : undefined,
    clockoutApply: params.type === 'clockout' ? params.apply : undefined,
  })
    .onConflict(['user', 'date'])
    .merge([params.type]); // ON DUPLICATE KEY UPDATE
}

export async function getRecords(this: DatabaseAccess, params: {
  byUserAccount?: string,
  byUserName?: string,
  bySection?: string,
  byDepartment?: string,
  byDevice?: string,
  sortBy?: 'byUserAccount' | 'byUserName' | 'bySection' | 'byDepartment',
  sortDesc?: boolean, // true:昇順、false:降順、undefined:ソートなし
  from?: Date,
  to?: Date,
  sortDateDesc?: boolean, // true:昇順、false:降順、undefined:ソートなし
  limit?: number,
  offset?: number
}) {
  type RecordResult = {
    id: number,
    type: string,
    typeDescription: string,
    timestamp: Date,
    userAccount: string,
    userName: string,
    department?: string,
    section?: string
  };

  const result = await this.knex
    .select<RecordResult[]>
    (
      { id: 'record.id' }, { type: 'recordType.name' }, { typeDescription: 'recordType.description' },
      { timestamp: 'record.timestamp' }, { userAccount: 'user.account' }, { userName: 'user.name' }, { department: 'department.name' }, { section: 'section.name' }
    )
    .from('recordLog')
    .join('recordType', { 'recordType.id': 'record.type' })
    .join('user', { 'user.id': 'record.user' })
    .join('device', { 'device.id': 'record.device' })
    .leftJoin('section', { 'section.id': 'user.section' })
    .leftJoin('department', { 'department.id': 'section.department' })
    .where(function (builder) {
      if (params.byUserAccount) {
        builder.where('user.account', 'like', `%${params.byUserAccount}%`);
      }
      if (params.byUserName) {
        builder.where('user.name', 'like', `%${params.byUserName}%`);
      }
      if (params.bySection) {
        builder.where('section.name', 'like', `%${params.bySection}%`);
      }
      if (params.byDepartment) {
        builder.where('department.name', 'like', `%${params.byDepartment}%`);
      }
      if (params.byDevice) {
        builder.where('department.name', 'like', `%${params.byDepartment}%`);
      }
      if (params.from && params.to) {
        builder.whereBetween('timestamp', [params.from, params.to]);
      }
      else if (params.from) {
        builder.where('timestamp', '>=', params.from);
      }
      else if (params.to) {
        builder.where('timestamp', '<=', params.to);
      }
    })
    .modify(function (builder) {
      if (params.sortBy === 'byUserAccount') {
        builder.orderBy('user.account', params.sortDesc ? 'desc' : 'asc')
      }
      else if (params.sortBy === 'byUserName') {
        builder.orderBy('user.name', params.sortDesc ? 'desc' : 'asc')
      }
      else if (params.sortBy === 'byDepartment') {
        builder.orderBy('department.name', params.sortDesc ? 'desc' : 'asc')
      }
      else if (params.sortBy === 'bySection') {
        builder.orderBy('section.name', params.sortDesc ? 'desc' : 'asc')
      }
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    });

  return result;
}
