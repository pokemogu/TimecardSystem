import createHttpError from 'http-errors';

import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import type * as apiif from '../APIInterfaces';
import { Knex } from 'knex';

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

export async function submitRecord(this: DatabaseAccess, userInfo: UserInfo, recordType: string, params: apiif.RecordRequestBody, trx?: Knex.Transaction) {

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
  // 前提としてテーブルrecordにはclockin/stepout/reeenter/clockoutという打刻種類のフィールド名があり
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

  const insertOperation = this.knex('record').insert({
    user: userId,
    date: recordDateString,

    clockin: recordType === 'clockin' ? params.timestamp : undefined,
    clockinDevice: recordType === 'clockin' ? deviceId : undefined,
    clockinApply: recordType === 'clockin' ? params.applyId : undefined,

    stepout: recordType === 'stepout' ? params.timestamp : undefined,
    stepoutDevice: recordType === 'stepout' ? deviceId : undefined,
    stepoutApply: recordType === 'stepout' ? params.applyId : undefined,

    reenter: recordType === 'reenter' ? params.timestamp : undefined,
    reenterDevice: recordType === 'reenter' ? deviceId : undefined,
    reenterApply: recordType === 'reenter' ? params.applyId : undefined,

    clockout: recordType === 'clockout' ? params.timestamp : undefined,
    clockoutDevice: recordType === 'clockout' ? deviceId : undefined,
    clockoutApply: recordType === 'clockout' ? params.applyId : undefined,
  })
    .onConflict(['user', 'date'])
    .merge(mergeColumns); // ON DUPLICATE KEY UPDATE

  if (trx) {
    await insertOperation.transacting(trx);
  }
  else {
    await insertOperation;
  }
}

export function getRecordTimeWithOnTimeQuery(this: DatabaseAccess, roundMinutes: number = 0) {
  const roundSql = (datetime: string, isRoundUp: boolean) => {
    if (roundMinutes <= 0) {
      return undefined;
    }
    const roundSeconds = roundMinutes * 60;
    const roundFunc = isRoundUp ? 'CEIL' : 'FLOOR';
    return `FROM_UNIXTIME( ${roundFunc}( UNIX_TIMESTAMP(${datetime}) / ${roundSeconds} ) * ${roundSeconds} )`;
  }

  const clockInRoundSql = roundSql('clockin', true);
  const stepoutRoundSql = roundSql('stepout', false);
  const reenterRoundSql = roundSql('reenter', true);
  const clockOutRoundSql = roundSql('clockout', false);

  return this.knex.select({
    userId: 'userId', date: 'date',
    clockin: clockInRoundSql ? this.knex.raw(clockInRoundSql) : 'clockin',
    stepout: stepoutRoundSql ? this.knex.raw(stepoutRoundSql) : 'stepout',
    reenter: reenterRoundSql ? this.knex.raw(reenterRoundSql) : 'reenter',
    clockout: clockOutRoundSql ? this.knex.raw(clockOutRoundSql) : 'clockout',
    clockinApply: 'clockinApply', stepoutApply: 'stepoutApply', reenterApply: 'reenterApply', clockoutApply: 'clockoutApply',
    clockinDeviceAccount: 'clockinDeviceAccount', clockinDeviceName: 'clockinDeviceName',
    stepoutDeviceAccount: 'stepoutDeviceAccount', stepoutDeviceName: 'stepoutDeviceName',
    reenterDeviceAccount: 'reenterDeviceAccount', reenterDeviceName: 'reenterDeviceName',
    clockoutDeviceAccount: 'clockoutDeviceAccount', clockoutDeviceName: 'clockoutDeviceName',
    //workPatternId: 'workPatternId', workPatternName: 'workPatternName',
    breakPeriodMinutes: 'breakPeriodMinutes',
    onTimeStart: 'onTimeStart', onTimeEnd: 'onTimeEnd',
    // 勤務時間は(退出時刻 - 出勤時刻 - 休憩時間)で算出する。
    workTime: this.knex.raw(`TIMESTAMPADD(MINUTE, 0 - breakPeriodMinutes, TIMEDIFF(${clockOutRoundSql ?? 'clockout'}, ${clockInRoundSql ?? 'clockin'}))`),
    earlyOverTime: this.knex.raw(`TIMEDIFF(onTimeStart, ${clockInRoundSql ?? 'clockin'})`),
    lateOverTime: this.knex.raw(`TIMEDIFF(${clockOutRoundSql ?? 'clockout'}, onTimeEnd)`)
  })
    .from('recordTimeWithOnTimePre')
    .orderBy('date')
    .orderBy('userId')
    .as('recordTimeWithOnTime');
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

    stepout?: Date,
    stepoutDeviceAccount?: string,
    stepoutDeviceName?: string,
    stepoutApplyId?: number,

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
    onTimeEnd: Date | null,
    breakPeriodMinutes: number | null,

    applies?: string | null
  };

  return await this.knex.transaction(async (trx) => {

    // 指定された期間の全ての日とユーザー名の組み合わせレコードを格納した一時テーブルを動的に生成する
    // Knexではコネクションプーリングを使用している為、複数ユーザーアクセス時に一時テーブル名の重複が発生する可能性があることから、
    // ランダムなテーブル名を動的に生成する。
    const alldaysTempTableName = 'alldays_' + Math.random().toString(36).slice(2);
    if (params.selectAllDays === true && params.from && params.to) {
      await this.knex.raw('CALL generateAllDaysForUsers(?, ?, ?)', [alldaysTempTableName, params.from, params.to]).transacting(trx);
    }

    const results = await this.knex
      .select
      ({
        date: params.selectAllDays === true ? `${alldaysTempTableName}.date` : 'recordTimeWithOnTime.date', clockin: 'clockin', stepout: 'stepout', reenter: 'reenter', clockout: 'clockout',
        clockinDeviceAccount: 'clockinDeviceAccount', stepoutDeviceAccount: 'stepoutDeviceAccount', reenterDeviceAccount: 'reenterDeviceAccount', clockoutDeviceAccount: 'clockoutDeviceAccount',
        clockinDeviceName: 'clockinDeviceName', stepoutDeviceName: 'stepoutDeviceName', reenterDeviceName: 'reenterDeviceName', clockoutDeviceName: 'clockoutDeviceName',
        clockinApplyId: 'clockinApply', stepoutApplyId: 'stepoutApply', reenterApplyId: 'reenterApply', clockoutApplyId: 'clockoutApply',
        userAccount: 'user.account', userName: 'user.name', departmentName: 'department.name', sectionName: 'section.name',
        earlyOverTime: 'earlyOverTime', lateOverTime: 'lateOverTime',
        onTimeStart: 'onTimeStart', onTimeEnd: 'onTimeEnd',
        breakPeriodMinutes: 'breakPeriodMinutes'
        //applies: this.knex.raw('JSON_ARRAYAGG(apply.id)')
      })
      //.from('recordTimeWithOnTime')
      .from(this.getRecordTimeWithOnTimeQuery(params.roundMinutes ?? 0))
      .modify<any, RecordResult[]>(function (builder) {
        if (params.selectAllDays === true && params.from && params.to) {
          builder.rightJoin(alldaysTempTableName, { [`${alldaysTempTableName}.date`]: 'recordTimeWithOnTime.date', [`${alldaysTempTableName}.userId`]: 'recordTimeWithOnTime.userId' })
        }
      })
      .join('user', { 'user.id': params.selectAllDays === true ? `${alldaysTempTableName}.userId` : 'userId' })
      .leftJoin('section', { 'section.id': 'user.section' })
      .leftJoin('department', { 'department.id': 'section.department' })
      //.leftJoin('apply', { 'apply.user': 'user.id', 'apply.date': params.selectAllDays === true ? `${alldaysTempTableName}.date` : 'date' })
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
          builder.where('clockinDeviceName', 'like', `%${params.byDevice}%`);
        }
        if (params.from) {
          builder.where(params.selectAllDays === true ? `${alldaysTempTableName}.date` : 'recordTimeWithOnTime.date', '>=', params.from);
        }
        if (params.to) {
          builder.where(params.selectAllDays === true ? `${alldaysTempTableName}.date` : 'recordTimeWithOnTime.date', '<=', params.to);
        }

        if (params.clockin === true) {
          builder.whereNotNull('clockin');
        }
        else if (params.clockin === false) {
          builder.whereNull('clockin');
        }

        if (params.stepout === true) {
          builder.whereNotNull('stepout');
        }
        else if (params.stepout === false) {
          builder.whereNull('stepout');
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
          builder.orderBy(`user.account`, params.sortDesc ? 'desc' : 'asc')
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
      })
      /*
      .groupBy([
        params.selectAllDays === true ? `${alldaysTempTableName}.date` : 'date',
        'clockin', 'stepout', 'reenter', 'clockout',
        'clockinDeviceAccount', 'stepoutDeviceAccount', 'reenterDeviceAccount', 'clockoutDeviceAccount',
        'clockinDeviceName', 'stepoutDeviceName', 'reenterDeviceName', 'clockoutDeviceName',
        'clockinApply', 'stepoutApply', 'reenterApply', 'clockoutApply',
        'user.account', 'user.name', 'department.name', 'section.name',
        'earlyOverTime', 'lateOverTime', 'onTimeStart', 'onTimeEnd'
      ])
      */
      //.groupBy([
      //  params.selectAllDays === true ? `${alldaysTempTableName}.date` : 'date',
      //  params.selectAllDays === true ? `${alldaysTempTableName}.userId` : 'user.id',
      //])
      .transacting(trx);

    // 動的生成したテーブルを削除する
    if (params.selectAllDays === true && params.from && params.to) {
      await this.knex.raw(`DROP TEMPORARY TABLE ${alldaysTempTableName}`).transacting(trx);
    }

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
        stepout: result.stepout ? {
          timestamp: result.stepout,
          deviceAccount: result.stepoutDeviceAccount,
          deviceName: result.stepoutDeviceName,
          applyId: result.stepoutApplyId
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
        onTimeEnd: result.onTimeEnd ?? undefined,
        breakPeriodMinutes: result.breakPeriodMinutes ?? undefined
      }
    });
  });
}

export async function getRecordAndApplyList(this: DatabaseAccess, params: apiif.RecordRequestQuery) {
  console.time('getRecordAndApplyList')
  const recordAndApplyList: apiif.RecordAndApplyResponseData[] = await this.getRecords(params);
  if (recordAndApplyList && recordAndApplyList.length > 0) {
    //const userAccounts = recordAndApplyList.map(record => record.userAccount);
    const userAccounts = [...new Set(recordAndApplyList.map(record => record.userAccount))];
    //const applyDates = recordAndApplyList.map(record => new Date(record.date));
    const applyDates = [...new Set(recordAndApplyList.map(record => new Date(record.date)))];
    const applies = await this.getApply({
      targetedUserAccounts: userAccounts,
      dateFrom: applyDates.reduce((prev, cur) => (prev < cur) ? prev : cur),
      dateTo: applyDates.reduce((prev, cur) => (prev > cur) ? prev : cur),
    })

    if (applies && applies.length > 0) {
      for (const recordAndApply of recordAndApplyList) {
        const existingApplies = applies.filter(apply =>
          (apply.targetUser.account === recordAndApply.userAccount) &&
          (apply.date?.getTime() === recordAndApply.date.getTime()) &&
          (apply.isApproved !== false) // 否認された申請は含めない
        );

        if (existingApplies.length > 0) {
          recordAndApply.applies = [];
          Array.prototype.push.apply(recordAndApply.applies, existingApplies);
        }
      }
    }
  }
  console.timeEnd('getRecordAndApplyList')
  return recordAndApplyList;
}