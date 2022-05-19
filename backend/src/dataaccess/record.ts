import createHttpError from 'http-errors';

import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

function dateToLocalString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`;
}

///////////////////////////////////////////////////////////////////////
// 打刻情報関連
///////////////////////////////////////////////////////////////////////

export async function submitRecord(this: DatabaseAccess, userInfo: UserInfo, recordType: string, params: apiif.RecordRequestBody) {

  // type はデータベースから取得済のキャッシュを利用する
  if (!(recordType in DatabaseAccess.recordTypeCache)) {
    throw new Error('invalid type');
  }

  let userId = -1;
  if (params.account) {
    const targetUserId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', params.account).first())?.id;
    if (!targetUserId) {
      throw new createHttpError.NotFound(`指定されたユーザーID ${params.account} が見つかりません`);
    }
    else {
      userId = targetUserId;
    }
  }
  else {
    userId = userInfo.id;
  }

  // 出勤(clockin)以外の打刻は前日からの日跨ぎ勤務である可能性があるので、
  // (なお労働基準法の規定上、出勤時の日付は必ず勤務日となるので、出勤打刻の場合は前日チェックはしない)
  // 当日の出勤打刻が無い、かつ前日の出勤打刻がある、場合は前日の打刻として記録する
  const currentDayString = dateToLocalString(params.timestamp);
  const beforeDay = new Date(params.timestamp);
  beforeDay.setDate(beforeDay.getDate() - 1);
  const beforeDayString = dateToLocalString(beforeDay);

  let recordDateString = currentDayString;
  if (recordType !== 'clockin') {
    const records = await this.knex.select<{ id: number, date: Date }[]>({ id: 'id', date: 'date' })
      .from('record')
      .where('user', userId)
      .andWhere('clockin', 'is not', null)
      .andWhereBetween('date', [beforeDayString, currentDayString]);

    if (!records.some(record => dateToLocalString(record.date) === currentDayString)) {
      //console.log('record: currentDay not found')
      if (records.some(record => dateToLocalString(record.date) === beforeDayString)) {
        //console.log('record: beforeDay found')
        recordDateString = beforeDayString;
      }
    }
  }

  // 打刻機器が指定されている場合は打刻機器IDを取得する
  let deviceId: number | undefined = undefined;
  if (params.deviceAccount) {
    //console.log('params.deviceAccount: ' + params.deviceAccount)
    deviceId = (await this.knex.select<{ id: number }[]>({ id: 'id' })
      .from('user')
      .where('account', params.deviceAccount)
      .andWhere('isDevice', true)
      .first())?.id;
    //console.log('deviceId: ' + deviceId)
  }

  const mergeColumns: string[] = [];
  switch (recordType) {
    case 'clockin':
      Array.prototype.push.apply(mergeColumns, ['clockin', 'clockinDevice', 'clockinApply']);
      break;
    case 'break':
      Array.prototype.push.apply(mergeColumns, ['break', 'breakDevice', 'breakApply']);
      break;
    case 'reenter':
      Array.prototype.push.apply(mergeColumns, ['reenter', 'reenterDevice', 'reenterApply']);
      break;
    case 'clockout':
      Array.prototype.push.apply(mergeColumns, ['clockout', 'clockoutDevice', 'clockoutApply']);
      break;
  }

  await this.knex('record').insert({
    user: userId,
    date: recordDateString,

    clockin: recordType === 'clockin' ? params.timestamp : undefined,
    clockinDevice: recordType === 'clockin' ? deviceId : undefined,
    clockinApply: recordType === 'clockin' ? params.applyId : undefined,

    break: recordType === 'break' ? params.timestamp : undefined,
    breakDevice: recordType === 'break' ? deviceId : undefined,
    breakApply: recordType === 'break' ? params.applyId : undefined,

    reenter: recordType === 'reenter' ? params.timestamp : undefined,
    reenterDevice: recordType === 'reenter' ? deviceId : undefined,
    reenterApply: recordType === 'reenter' ? params.applyId : undefined,

    clockout: recordType === 'clockout' ? params.timestamp : undefined,
    clockoutDevice: recordType === 'clockout' ? deviceId : undefined,
    clockoutApply: recordType === 'clockout' ? params.applyId : undefined,
  })
    .onConflict(['user', 'date'])
    .merge(mergeColumns); // ON DUPLICATE KEY UPDATE
}

export async function getRecords(this: DatabaseAccess, params: apiif.RecordRequestQuery) {

  type RecordResult = {
    id: number,
    userAccount: string,
    userName: string,
    department: string,
    section: string
    date: Date,

    clockin?: Date,
    clockinDeviceAccount?: string,
    clockinDeviceName?: string,
    clockinApplyId?: number,

    break?: Date,
    breakDeviceAccount?: string,
    breakDeviceName?: string,
    breakApplyId?: number,

    reenter?: Date,
    reenterDeviceAccount?: string,
    reenterDeviceName?: string,
    reenterApplyId?: number,

    clockout?: Date,
    clockoutDeviceAccount?: string,
    clockoutDeviceName?: string,
    clockoutApplyId?: number,
  };

  const results = await this.knex
    .select<RecordResult[]>
    ({
      id: 'record.id', date: 'record.date', clockin: 'record.clockin', break: 'record.break', reenter: 'record.reenter', clockout: 'record.clockout',
      clockinDeviceAccount: 'd1.account', breakDeviceAccount: 'd2.account', reenterDeviceAccount: 'd3.account', clockoutDeviceAccount: 'd4.account',
      clockinDeviceName: 'd1.name', breakDeviceName: 'd2.name', reenterDeviceName: 'd3.name', clockoutDeviceName: 'd4.name',
      clockinApplyId: 'record.clockinApply', breakApplyId: 'record.breakApply', reenterApplyId: 'record.reenterApply', clockoutApplyId: 'record.clockoutApply',
      userAccount: 'user.account', userName: 'user.name', department: 'department.name', section: 'section.name'
    })
    .from('record')
    .join('user', { 'user.id': 'record.user' })
    .leftJoin('user as d1', { 'd1.id': 'record.clockinDevice' })
    .leftJoin('user as d2', { 'd2.id': 'record.breakDevice' })
    .leftJoin('user as d3', { 'd3.id': 'record.reenterDevice' })
    .leftJoin('user as d4', { 'd4.id': 'record.clockoutDevice' })
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
        builder.where('d1.name', 'like', `%${params.byDevice}%`);
      }
      else if (params.from) {
        builder.where('record.date', '>=', params.from);
      }
      else if (params.to) {
        builder.where('record.date', '<=', params.to);
      }

      if (params.clockin === true) {
        builder.whereNotNull('record.clockin');
      }
      else if (params.clockin === false) {
        builder.whereNull('record.clockin');
      }

      if (params.break === true) {
        builder.whereNotNull('record.break');
      }
      else if (params.break === false) {
        builder.whereNull('record.break');
      }

      if (params.reenter === true) {
        builder.whereNotNull('record.reenter');
      }
      else if (params.reenter === false) {
        builder.whereNull('record.reenter');
      }

      if (params.clockout === true) {
        builder.whereNotNull('record.clockout');
      }
      else if (params.clockout === false) {
        builder.whereNull('record.clockout');
      }
    })
    .modify<any, RecordResult[]>(function (builder) {
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

  return results.map<apiif.RecordResponseData>(result => {
    return {
      userAccount: result.userAccount,
      userName: result.userName,
      userDepartment: result.department,
      userSection: result.section,
      date: dateToLocalString(result.date),
      clockin: result.clockin ? {
        timestamp: result.clockin,
        deviceAccount: result.clockinDeviceAccount,
        deviceName: result.clockinDeviceName,
        applyId: result.clockinApplyId
      } : undefined,
      break: result.break ? {
        timestamp: result.break,
        deviceAccount: result.breakDeviceAccount,
        deviceName: result.breakDeviceName,
        applyId: result.breakApplyId
      } : undefined,
      reenter: result.reenter ? {
        timestamp: result.reenter,
        deviceAccount: result.reenterDeviceAccount,
        deviceName: result.reenterDeviceName,
        applyId: result.reenterApplyId
      } : undefined,
      clockout: result.clockout ? {
        timestamp: result.clockout,
        deviceAccount: result.clockoutDeviceAccount,
        deviceName: result.clockoutDeviceName,
        applyId: result.clockoutApplyId
      } : undefined,
    }
  });
}
