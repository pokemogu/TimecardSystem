import createHttpError from 'http-errors';

import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

function dateToLocalString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1)}-${date.getDate()}`;
}

function timeStringToSeconds(timeStr: string) {
  const timeStrParts = timeStr.split(':', 3);
  if (timeStrParts.length < 3) {
    return 0;
  }

  const hour = parseInt(timeStrParts[0]);
  const min = parseInt(timeStrParts[1]);
  const sec = parseInt(timeStrParts[2]);
  const negative = timeStrParts[0].charAt(0) === '-' ? -1 : 1;

  return ((Math.abs(hour) * 60 * 60) + (min * 60) + sec) * negative;
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
      if (records.some(record => dateToLocalString(record.date) === beforeDayString)) {
        recordDateString = beforeDayString;
      }
    }
  }

  // 打刻機器が指定されている場合は打刻機器IDを取得する
  let deviceId: number | undefined = undefined;
  if (params.deviceAccount) {
    deviceId = (await this.knex.select<{ id: number }[]>({ id: 'id' })
      .from('user')
      .where('account', params.deviceAccount)
      .andWhere('isDevice', true)
      .first())?.id;
  }

  // データベーステーブルで更新するフィールド名を指定する。対象となるフィールド名を文字列でmergeColumns配列に格納する。
  // これをknexのmerge関数に渡すことで、ON DUPLICATE KEY UPDATEでの更新フィールドを指定することができる。
  // 
  // 前提としてテーブルrecordにはclockin/break/reeenter/clockoutという打刻種類のフィールド名があり
  // これらの打刻種類のフィールド名が変数recordTypeに格納されている。
  //
  // それぞれの打刻端末と打刻申請のフィールド名は↑のフィールド名にDeviceあるいはApplyを付けたものである。
  // 打刻端末あるいは打刻申請が指定されていない場合は、これらのフィールドは更新しないようにする。
  const mergeColumns = [recordType];
  if (deviceId) {
    mergeColumns.push(`${recordType}Device`);
  }
  if (params.applyId) {
    mergeColumns.push(`${recordType}Apply`);
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
    userAccount: string,
    userName: string,
    departmentName: string,
    sectionName: string
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

    earlyOverTime: string | null,
    lateOverTime: string | null,

    onTimeStart: Date | null,
    onTimeEnd: Date | null
  };

  const results = await this.knex
    .select<RecordResult[]>
    ({
      date: 'date', clockin: 'clockin', break: 'break', reenter: 'reenter', clockout: 'clockout',
      clockinDeviceAccount: 'clockinDeviceAccount', breakDeviceAccount: 'breakDeviceAccount', reenterDeviceAccount: 'reenterDeviceAccount', clockoutDeviceAccount: 'clockoutDeviceAccount',
      clockinDeviceName: 'clockinDeviceName', breakDeviceName: 'breakDeviceName', reenterDeviceName: 'reenterDeviceName', clockoutDeviceName: 'clockoutDeviceName',
      clockinApplyId: 'clockinApply', breakApplyId: 'breakApply', reenterApplyId: 'reenterApply', clockoutApplyId: 'clockoutApply',
      userAccount: 'userAccount', userName: 'userName', departmentName: 'departmentName', sectionName: 'sectionName',
      earlyOverTime: 'earlyOverTime', lateOverTime: 'lateOverTime',
      onTimeStart: 'onTimeStart', onTimeEnd: 'onTimeEnd'
    })
    .from('recordTimeWithOnTime')
    .where(function (builder) {
      if (params.byUserAccount) {
        builder.where('userAccount', 'like', `%${params.byUserAccount}%`);
      }
      if (params.byUserName) {
        builder.where('userName', 'like', `%${params.byUserName}%`);
      }
      if (params.bySection) {
        builder.where('sectionName', 'like', `%${params.bySection}%`);
      }
      if (params.byDepartment) {
        builder.where('departmentName', 'like', `%${params.byDepartment}%`);
      }
      if (params.byDevice) {
        builder.where('clockinDeviceName', 'like', `%${params.byDevice}%`);
      }
      if (params.from) {
        builder.where('date', '>=', params.from);
      }
      if (params.to) {
        builder.where('date', '<=', params.to);
      }

      if (params.clockin === true) {
        builder.whereNotNull('clockin');
      }
      else if (params.clockin === false) {
        builder.whereNull('clockin');
      }

      if (params.break === true) {
        builder.whereNotNull('break');
      }
      else if (params.break === false) {
        builder.whereNull('break');
      }

      if (params.reenter === true) {
        builder.whereNotNull('reenter');
      }
      else if (params.reenter === false) {
        builder.whereNull('reenter');
      }

      if (params.clockout === true) {
        builder.whereNotNull('clockout');
      }
      else if (params.clockout === false) {
        builder.whereNull('clockout');
      }
    })
    .modify<any, RecordResult[]>(function (builder) {
      if (params.sortBy === 'byUserAccount') {
        builder.orderBy('userAccount', params.sortDesc ? 'desc' : 'asc')
      }
      else if (params.sortBy === 'byUserName') {
        builder.orderBy('userName', params.sortDesc ? 'desc' : 'asc')
      }
      else if (params.sortBy === 'byDepartment') {
        builder.orderBy('departmentName', params.sortDesc ? 'desc' : 'asc')
      }
      else if (params.sortBy === 'bySection') {
        builder.orderBy('sectionName', params.sortDesc ? 'desc' : 'asc')
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
      userDepartment: result.departmentName,
      userSection: result.sectionName,
      date: result.date,
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

      earlyOverTimeSeconds: result.earlyOverTime ? timeStringToSeconds(result.earlyOverTime) : undefined,
      lateOverTimeSeconds: result.lateOverTime ? timeStringToSeconds(result.lateOverTime) : undefined,
      onTimeStart: result.onTimeStart ?? undefined,
      onTimeEnd: result.onTimeEnd ?? undefined
    }
  });
}
