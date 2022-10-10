import type * as apiif from '../APIInterfaces';
import { DatabaseAccess } from '../dataaccess';

function setTimeToZero(date: Date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
}

export async function getTotalAnnualLeaves(this: DatabaseAccess, params?: { accounts?: string[], date?: Date, isNotExpired?: boolean }) {
  const curdate = params?.date ?? new Date();
  const isNotExpired = params?.isNotExpired ?? true;
  setTimeToZero(curdate);

  const results = await this.knex.select<apiif.TotalAnnualLeavesResponseData[]>({ userAccount: 'user.account' })
    .from('user')
    .leftJoin('annualLeave', { 'annualLeave.user': 'user.id' })
    .sum('annualLeave.dayAmount', { as: 'dayAmount' })
    .max('annualLeave.hourAmount', { as: 'hourAmount' })
    .max('annualLeave.grantedAt', { as: 'countPaidLeaveFrom' })
    .where(function (builder) {
      builder.where('user.isDevice', false);
      if (params?.accounts) {
        if (params.accounts.length > 0) {
          builder.whereIn('user.account', params.accounts);
        }
      }
      builder.where('annualLeave.grantedAt', '<=', curdate);
      if (isNotExpired === true) {
        builder.where('annualLeave.expireAt', '>', curdate);
      }
    })
    .groupBy('annualLeave.user') as apiif.TotalAnnualLeavesResponseData[];
  //.first() as ResultRecord;

  for (const result of results) {
    if (typeof result.dayAmount === 'string') {
      result.dayAmount = parseFloat(result.dayAmount);
    }
    else if (result.dayAmount === null) {
      result.dayAmount = 0;
    }
    if (typeof result.hourAmount === 'string') {
      result.dayAmount = parseFloat(result.hourAmount);
    }
    else if (result.hourAmount === null) {
      result.hourAmount = 0;
    }
  }

  return results;
}

export async function getTotalScheduledAnnualLeaves(this: DatabaseAccess, params?: apiif.TotalScheduledAnnualLeavesQuery) {
  type ResultRecord = { userAccount: string, userName: string, departmentName: string, sectionName: string, dayAmountScheduled: number };
  const isPaid = params?.isPaid ?? true;

  const results = await this.knex.select<ResultRecord[]>({
    userAccount: 'user.account', userName: 'user.name',
    departmentName: 'department.name', sectionName: 'section.name'
  })
    .from('user')
    .leftJoin('section', { 'section.id': 'user.section' })
    .leftJoin('department', { 'department.id': 'section.department' })
    .leftJoin('schedule', { 'schedule.user': 'user.id' })
    .sum('schedule.dayAmount', { as: 'dayAmountScheduled' })
    .count('schedule.dayAmount', { as: 'dayAmountScheduledCount' })
    .where(function (builder) {
      builder.where('user.isDevice', false);

      if (params?.accounts) {
        if (params.accounts.length > 0) {
          builder.whereIn('user.account', params.accounts);
        }
      }
      else if (params?.userAccount) {
        builder.where('user.account', 'like', `%${params.userAccount}%`)
      }

      if (params?.departmentName) {
        builder.where('department.name', 'like', `%${params.departmentName}%`)
      }
      if (params?.sectionName) {
        builder.where('section.name', 'like', `%${params.sectionName}%`)
      }

      if (params?.date) {
        const date = new Date(params.date);
        setTimeToZero(date);
        builder.having('date', '>=', date);
      }
      if (isPaid === true) {
        builder.having('isPaid', '=', true);
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
      if (params?.dayAmount) {
        builder.having('dayAmountScheduled', '<=', params.dayAmount).orHaving('dayAmountScheduledCount', '=', 0);
        //builder.havingRaw('SUM(schedule.dayAmount) <= 4.0');
      }
    }) as ResultRecord[];

  for (const result of results) {
    if (typeof result.dayAmountScheduled === 'string') {
      result.dayAmountScheduled = parseFloat(result.dayAmountScheduled);
    }
    else if (result.dayAmountScheduled === null) {
      result.dayAmountScheduled = 0;
    }
  }

  const leaves = await this.getTotalAnnualLeaves({
    accounts: results.map(result => result.userAccount),
    date: params?.date,
    isNotExpired: params?.isNotExpired
  });

  return results.map(result => {
    const leave = leaves.find(leave => leave.userAccount === result.userAccount);
    return <apiif.TotalScheduledAnnualLeavesResponseData>{
      userAccount: result.userAccount,
      userName: result?.userName,
      departmentName: result?.departmentName,
      sectionName: result?.sectionName,
      dayAmount: leave?.dayAmount,
      dayAmountScheduled: result?.dayAmountScheduled ?? 0,
      hourAmount: leave?.hourAmount,
      countPaidLeaveFrom: leave?.countPaidLeaveFrom
    };
  });
}

export async function getTotalWorkTimeInfo(this: DatabaseAccess, params?: apiif.TotalWorkTimeInfoRequestQuery) {

  // 時刻の丸め指定がある場合はMySQLの関数で丸めを行なう
  // 切り上げはCEIL関数、切り下げはFLOOR関数、四捨五入はROUND関数を使用する
  const roundSql = function (seconds: string) {

    const roundType = params?.roundType ?? 'floor';
    const roundSeconds = params?.roundMinutes ? params.roundMinutes * 60 : 60;
    const roundFunc = roundType === 'ceil' ? 'CEIL' : (roundType === 'floor' ? 'FLOOR' : 'ROUND');

    return `${roundFunc}((${seconds}) / ${roundSeconds}) * ${roundSeconds}`;
  };

  console.log(roundSql('TIME_TO_SEC(workTime)'));

  const results = await this.knex.select({
    userAccount: 'recordTimeWithOnTime.userAccount', userName: 'recordTimeWithOnTime.userName',
    departmentName: 'recordTimeWithOnTime.departmentName', sectionName: 'recordTimeWithOnTime.sectionName',
    totalLateCount: this.knex.raw('SUM(IF(earlyOverTime < 0, 1, 0))'),
    totalEarlyLeaveCount: this.knex.raw('SUM(IF(lateOverTime < 0, 1, 0))'),
    //    totalWorkTime: this.knex.raw('SEC_TO_TIME(SUM(TIME_TO_SEC(workTime)))'),
    totalWorkTime: this.knex.raw(`SEC_TO_TIME(SUM(${roundSql('TIME_TO_SEC(workTime)')}))`),
    //    totalEarlyOverTime: this.knex.raw('SEC_TO_TIME(SUM(IF(earlyOverTime > 0, TIME_TO_SEC(earlyOverTime), 0)))'),
    totalEarlyOverTime: this.knex.raw(`SEC_TO_TIME(SUM(IF(earlyOverTime > 0, ${roundSql('TIME_TO_SEC(earlyOverTime)')}, 0)))`),
    //    totalLateOverTime: this.knex.raw('SEC_TO_TIME(SUM(IF(lateOverTime > 0, TIME_TO_SEC(lateOverTime), 0)))')
    totalLateOverTime: this.knex.raw(`SEC_TO_TIME(SUM(IF(lateOverTime > 0, ${roundSql('TIME_TO_SEC(lateOverTime)')}, 0)))`)
  })
    .from('recordTimeWithOnTime')
    .where(function (builder) {
      if (params?.userAccount) {
        builder.where('userAccount', 'like', `%${params.userAccount}%`);
      }
      if (params?.userName) {
        builder.where('userName', 'like', `%${params.userName}%`);
      }
      if (params?.departmentName) {
        builder.where('departmentName', 'like', `%${params.departmentName}%`);
      }
      if (params?.sectionName) {
        builder.where('sectionName', 'like', `%${params.sectionName}%`);
      }
      if (params?.dateFrom) {
        const date = new Date(params.dateFrom);
        setTimeToZero(date);
        builder.where('date', '>=', date);
      }
      if (params?.dateTo) {
        const date = new Date(params.dateTo);
        setTimeToZero(date);
        builder.where('date', '<=', date);
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
    .groupBy('recordTimeWithOnTime.userId')
    .orderBy('recordTimeWithOnTime.userId') as apiif.TotalWorkTimeInfoResponseData[];

  for (const result of results) {
    if (typeof result.totalEarlyLeaveCount === 'string') {
      result.totalEarlyLeaveCount = parseInt(result.totalEarlyLeaveCount);
    }
    if (typeof result.totalLateCount === 'string') {
      result.totalLateCount = parseInt(result.totalLateCount);
    }
  }

  return results;
}