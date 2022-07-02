import createHttpError from 'http-errors';
import { format } from 'fecha';

import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import * as apiif from '../APIInterfaces';

///////////////////////////////////////////////////////////////////////
// 申請関連
///////////////////////////////////////////////////////////////////////
export async function submitApply(this: DatabaseAccess, userInfo: UserInfo, applyType: string, apply: apiif.ApplyRequestBody) {

  if (apply.dateTimeTo) {
    if (apply.dateTimeTo < apply.dateTimeFrom) {
      throw new createHttpError.BadRequest('日付範囲指定が不正です。');
    }
  }

  let workPatternId: number | null = null;
  if (applyType === 'holiday-work') {
    if (!apply.workPattern) {
      throw new createHttpError.BadRequest('休日出勤での勤務体系が指定されていません。');
    }
    const workPattern = await this.getWorkPattern(apply.workPattern);
    workPatternId = workPattern.id;
  }

  const applyTypeId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('applyType').where('name', applyType).first())?.id;
  if (!applyTypeId) {
    throw new createHttpError.NotFound(`指定された申請種類 ${applyType} が見つかりません`);
  }

  let userId = userInfo.id;
  if (apply.targetUserAccount) {
    const targetUserInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', apply.targetUserAccount).first();
    if (targetUserInfo) {
      userId = targetUserInfo.id;
    }
  }

  const routeInfo = await this.knex.select<{
    id: number,
    approvalLevel1MainUser: number, approvalLevel1SubUser: number
    approvalLevel2MainUser: number, approvalLevel2SubUser: number
    approvalLevel3MainUser: number, approvalLevel3SubUser: number
    approvalDecisionUser: number
  }[]>({
    id: 'id',
    approvalLevel1MainUser: 'approvalLevel1MainUser', approvalLevel1SubUser: 'approvalLevel1SubUser',
    approvalLevel2MainUser: 'approvalLevel2MainUser', approvalLevel2SubUser: 'approvalLevel2SubUser',
    approvalLevel3MainUser: 'approvalLevel3MainUser', approvalLevel3SubUser: 'approvalLevel3SubUser',
    approvalDecisionUser: 'approvalDecisionUser'
  })
    .from('approvalRoute').where('name', apply.routeName).first();
  if (!routeInfo) {
    throw new createHttpError.BadRequest(`承認ルート ${apply.routeName} が見つかりません`);
  }

  let lastApplyId = -1;

  await this.knex.transaction(async function (trx) {
    await trx('apply').insert({
      type: applyTypeId,
      user: userId,
      appliedUser: userInfo.id,
      timestamp: apply.timestamp,
      date: apply.date,
      dateTimeFrom: apply.dateTimeFrom,
      dateTimeTo: apply.dateTimeTo,
      dateRelated: apply.dateRelated,
      reason: apply.reason,
      contact: apply.contact,
      route: routeInfo.id,
      currentApprovingMainUser:
        routeInfo.approvalLevel1MainUser ?? routeInfo.approvalLevel2MainUser ?? routeInfo.approvalLevel2MainUser ?? routeInfo.approvalDecisionUser,
      currentApprovingSubUser:
        routeInfo.approvalLevel1SubUser ?? routeInfo.approvalLevel2SubUser ?? routeInfo.approvalLevel2SubUser,
      workPattern: workPatternId
    });

    const lastApplyResult = await trx.select<{ [name: string]: number }>(trx.raw('LAST_INSERT_ID()')).first();
    if (!lastApplyResult) {
      throw createHttpError(500, '', { internalMessage: 'MySQLの LAST_INSERT_ID() 実行に失敗しました' });
    }
    lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    // オプション指定があれば合わせて保存する
    if (apply.options) {
      const applyOptionTypeInfo = await trx.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('applyOptionType')
      const applyOptionValueInfo = await trx.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('applyOptionValue')

      const applyOptions: { apply: number, optionType: number, optionValue: number }[] = [];
      for (const option of apply.options) {
        const optionTypeId = applyOptionTypeInfo.find(info => info.name === option.name)?.id;
        const optionValueId = applyOptionValueInfo.find(info => info.name === option.value)?.id;

        if (!optionTypeId || !optionValueId) {
          throw new createHttpError.BadRequest(`指定されたオプション種類 ${option.name} かオプション値 ${option.value} が正しくありません`);
        }
        applyOptions.push({
          apply: lastApplyId,
          optionType: optionTypeId,
          optionValue: optionValueId
        });
      }
      await trx('applyOption').insert(applyOptions);
    }
  });

  return lastApplyId;
}

export async function getApplyTypeOfApply(this: DatabaseAccess, applyId: number) {

  const result = await this.knex.select<{ typeId: number, typeName: string, typeDescription: string, isSystemType: boolean }[]>({
    id: 'apply.id', typeName: 'applyType.name', typeDescription: 'applyType.description', isSystemType: 'applyType.isSystemType'
  })
    .from('apply')
    .leftJoin('applyType', { 'applyType.id': 'apply.type' })
    .where('apply.id', applyId)
    .first();

  if (!result) {
    throw new createHttpError.NotFound('指定されたIDの申請が見つかりません');
  }

  return <apiif.ApplyTypeResponseData>{
    id: result.typeId,
    name: result.typeName,
    description: result.typeDescription,
    isSystemType: result.isSystemType
  }
}

export async function getApplyOptions(this: DatabaseAccess, applyIds: number[]) {

  return await this.knex.select<{
    id: number, applyId: number, optionTypeId: number, optionTypeName: string, optionValueId: number, optionValueName: string
  }[]>({
    id: 'applyOption.id', applyId: 'applyOption.apply',
    optionTypeId: 'applyOption.optionType', optionTypeName: 'applyOptionType.name',
    optionValueId: 'applyOptionValue.id', optionValueName: 'applyOptionValue.name',
  })
    .from('applyOption')
    .leftJoin('applyOptionType', { 'applyOptionType.id': 'applyOption.optionType' })
    .leftJoin('applyOptionValue', { 'applyOptionValue.id': 'applyOption.optionValue' })
    .whereIn('applyOption.apply', applyIds);
}

export async function getApply(this: DatabaseAccess, params?: apiif.ApplyRequestQuery) {

  type RecordResult = {
    id: number, timestamp: Date, typeName: string, typeDescription: string, typeIsSystemType: boolean,
    targetUserId: number, targetUserAccount: string, targetUserName: string, targetUserEmail: string, targetUserSectionId: number,
    appliedUserId: number, appliedUserAccount: string, appliedUserName: string, appliedUserEmail: string, appliedUserSectionId: number,
    approvedLevel1UserId: number, approvedLevel1UserAccount: string, approvedLevel1UserName: string, approvedLevel1Timestamp: Date,
    approvedLevel2UserId: number, approvedLevel2UserAccount: string, approvedLevel2UserName: string, approvedLevel2Timestamp: Date,
    approvedLevel3UserId: number, approvedLevel3UserAccount: string, approvedLevel3UserName: string, approvedLevel3Timestamp: Date,
    approvedDecisionUserId: number, approvedDecisionUserAccount: string, approvedDecisionUserName: string, approvedDecisionTimestamp: Date,
    date: Date, dateTimeFrom: Date, dateTimeTo: Date, dateRelated: Date,
    reason: string, contact: string, routeName: string, isApproved: boolean,
    workPattern: string
  };

  const results = await this.knex.select<RecordResult[]>({
    id: 'apply.id', timestamp: 'apply.timestamp', typeName: 'applyType.name', typeDescription: 'applyType.description', typeIsSystemType: 'applyType.isSystemType',
    targetUserId: 'u0.id', targetUserAccount: 'u0.account', targetUserName: 'u0.name', targetUserEmail: 'u0.email', targetUserSectionId: 'u0.section',
    appliedUserId: 'u1.id', appliedUserAccount: 'u1.account', appliedUserName: 'u1.name', appliedUserEmail: 'u1.email', appliedUserSectionId: 'u1.section',
    approvedLevel1UserId: 'u2.id', approvedLevel1UserAccount: 'u2.account', approvedLevel1UserName: 'u2.name', approvedLevel1Timestamp: 'apply.approvedLevel1UserTimestamp',
    approvedLevel2UserId: 'u3.id', approvedLevel2UserAccount: 'u3.account', approvedLevel2UserName: 'u3.name', approvedLevel2Timestamp: 'apply.approvedLevel2UserTimestamp',
    approvedLevel3UserId: 'u4.id', approvedLevel3UserAccount: 'u4.account', approvedLevel3UserName: 'u4.name', approvedLevel3Timestamp: 'apply.approvedLevel3UserTimestamp',
    approvedDecisionUserId: 'u5.id', approvedDecisionUserAccount: 'u5.account', approvedDecisionUserName: 'u5.name', approvedDecisionTimestamp: 'apply.approvedDecisionUserTimestamp',
    currentApprovingMainUserId: 'u6.id', currentApprovingMainUserAccount: 'u6.account', currentApprovingMainUserName: 'u6.name',
    currentApprovingSubUserId: 'u7.id', currentApprovingSubUserAccount: 'u7.account', currentApprovingSubUserName: 'u7.name',
    date: 'apply.date', dateTimeFrom: 'apply.dateTimeFrom', dateTimeTo: 'apply.dateTimeTo', dateRelated: 'apply.dateRelated',
    reason: 'apply.reason', contact: 'apply.contact', routeName: 'approvalRoute.name', isApproved: 'apply.isApproved',
    workPattern: 'workPattern.name'
  })
    .from('apply')
    .leftJoin('applyType', { 'applyType.id': 'apply.type' })
    .leftJoin('approvalRoute', { 'approvalRoute.id': 'apply.route' })
    .leftJoin('workPattern', { 'workPattern.id': 'apply.workPattern' })
    .leftJoin('user as u0', { 'u0.id': 'apply.user' })
    .leftJoin('user as u1', { 'u1.id': 'apply.appliedUser' })
    .leftJoin('user as u2', { 'u2.id': 'apply.approvedLevel1User' })
    .leftJoin('user as u3', { 'u3.id': 'apply.approvedLevel2User' })
    .leftJoin('user as u4', { 'u4.id': 'apply.approvedLevel3User' })
    .leftJoin('user as u5', { 'u5.id': 'apply.approvedDecisionUser' })
    .leftJoin('user as u6', { 'u6.id': 'apply.currentApprovingMainUser' })
    .leftJoin('user as u7', { 'u7.id': 'apply.currentApprovingSubUser' })
    .where(function (builder) {
      if (params?.id) {
        builder.where('apply.id', params.id);
      }

      // 申請種類で検索
      if (params?.type) {
        builder.where('applyType.name', params.type);
      }

      // ユーザーで検索
      if (params?.targetedUserAccounts) {
        builder.whereIn('u0.account', params.targetedUserAccounts);
      }
      else if (params?.targetedUserAccount) {
        builder.where('u0.account', params.targetedUserAccount);
      }
      if (params?.approvingUserAccount) {
        builder.where(function (builder) {
          builder
            .where('u6.account', params.approvingUserAccount)
            .orWhere('u7.account', params.approvingUserAccount);
        });
      }
      if (params?.approvedUserAccount) {
        builder.where(function (builder) {
          builder
            .where('u2.account', params.approvedUserAccount)
            .orWhere('u3.account', params.approvedUserAccount)
            .orWhere('u4.account', params.approvedUserAccount)
            .orWhere('u5.account', params.approvedUserAccount);
        });
      }

      // 回付状況で検索
      if (params?.isApproved !== undefined) {
        builder.where(function (builder) {
          if (Array.isArray(params.isApproved)) {
            params.isApproved.forEach(approve => builder.orWhere('apply.isApproved', approve));
          }
          else if (params?.isApproved !== undefined) {
            builder.where('apply.isApproved', params.isApproved);
          }
        });
      }

      // 申請日付で検索
      if (params?.timestampFrom && params?.timestampTo) {
        builder.whereBetween('apply.timestamp', [params.timestampFrom, params.timestampTo]);
      }
      else if (params?.timestampFrom) {
        builder.where('apply.timestamp', '>=', params.timestampFrom);
      }
      else if (params?.timestampTo) {
        builder.where('apply.timestamp', '<=', params.timestampTo);
      }

      // 申請対象基準日で検索
      if (params?.dateFrom) {
        builder.where('apply.date', '>=', params.dateFrom);
      }
      if (params?.dateTo) {
        builder.where('apply.date', '<=', params.dateTo);
      }

      // 申請対象期間で検索
      if (params?.dateTimeFrom) {
        builder.where('apply.dateTimeFrom', '>=', params.dateTimeFrom);
      }
      if (params?.dateTimeTo) {
        builder.where('apply.dateTimeTo', '<=', params.dateTimeTo);
      }
    })
    .modify<any, RecordResult[]>(function (builder) {
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
        builder.offset(params.offset);
      }
    })

  if (!results) {
    throw new createHttpError.NotFound('指定された申請が見つかりません');
  }

  const resultOptions = await this.getApplyOptions(results.map(result => result.id));
  const sections = await this.getSections();

  return results.map<apiif.ApplyResponseData>(result => {
    return {
      id: result.id, timestamp: result.timestamp,
      type: {
        name: result.typeName,
        description: result.typeDescription
      },

      targetUser: {
        id: result.targetUserId,
        account: result.targetUserAccount,
        name: result.targetUserName,
        email: result.targetUserEmail,
        section: sections.find(section => section.id === result.targetUserSectionId)?.sectionName,
        department: sections.find(section => section.id === result.targetUserSectionId)?.departmentName
      },

      appliedUser: result.appliedUserId ? {
        id: result.appliedUserId,
        account: result.appliedUserAccount,
        name: result.appliedUserName,
        email: result.appliedUserEmail,
        section: sections.find(section => section.id === result.appliedUserSectionId)?.sectionName,
        department: sections.find(section => section.id === result.appliedUserSectionId)?.departmentName
      } : undefined,

      approvedLevel1User: result.approvedLevel1UserId ? {
        id: result.approvedLevel1UserId,
        account: result.approvedLevel1UserAccount,
        name: result.approvedLevel1UserName
      } : undefined,
      approvedLevel1Timestamp: result.approvedLevel1Timestamp ? result.approvedLevel1Timestamp : undefined,

      approvedLevel2User: result.approvedLevel2UserId ? {
        id: result.approvedLevel2UserId,
        account: result.approvedLevel2UserAccount,
        name: result.approvedLevel2UserName
      } : undefined,
      approvedLevel2Timestamp: result.approvedLevel2Timestamp ? result.approvedLevel2Timestamp : undefined,

      approvedLevel3User: result.approvedLevel3UserId ? {
        id: result.approvedLevel3UserId,
        account: result.approvedLevel3UserAccount,
        name: result.approvedLevel3UserName
      } : undefined,
      approvedLevel3Timestamp: result.approvedLevel3Timestamp ? result.approvedLevel3Timestamp : undefined,

      approvedDecisionUser: result.approvedDecisionUserId ? {
        id: result.approvedDecisionUserId,
        account: result.approvedDecisionUserAccount,
        name: result.approvedDecisionUserName
      } : undefined,
      approvedDecisionTimestamp: result.approvedDecisionTimestamp ? result.approvedDecisionTimestamp : undefined,

      date: result.date,
      dateTimeFrom: result.dateTimeFrom,
      dateTimeTo: result.dateTimeTo ? result.dateTimeTo : undefined,
      dateRelated: result.dateRelated ? result.dateRelated : undefined,
      reason: result.reason ?? undefined,
      contact: result.contact ?? undefined,
      routeName: result.routeName ?? undefined,
      isApproved: result.isApproved,

      options: (!resultOptions || resultOptions.length < 1) ? undefined :
        resultOptions.reduce((filtered, current) => {
          if (current.applyId === result.id) {
            filtered.push({ name: current.optionTypeName, value: current.optionValueName });
          }
          return filtered;
        }, <{ name: string, value: string }[]>[]),

      workPattern: result.workPattern
    }
  });
}

export async function getApplyCurrentApprovingUsers(this: DatabaseAccess, applyId: number) {

  const result = await this.knex.select<{
    currentApprovingMainUserId: number, currentApprovingMainUserAccount: string, currentApprovingMainUserName: string, currentApprovingMainUserEmail: string,
    currentApprovingSubUserId: number, currentApprovingSubUserAccount: string, currentApprovingSubUserName: string, currentApprovingSubUserEmail: string,
  }[]>({
    currentApprovingMainUserId: 'u1.id', currentApprovingMainUserAccount: 'u1.account', currentApprovingMainUserName: 'u1.name', currentApprovingMainUserEmail: 'u1.email',
    currentApprovingSubUserId: 'u2.id', currentApprovingSubUserAccount: 'u2.account', currentApprovingSubUserName: 'u2.name', currentApprovingSubUserEmail: 'u2.email'
  })
    .from('apply')
    .leftJoin('user as u1', { 'u1.id': 'apply.currentApprovingMainUser' })
    .leftJoin('user as u2', { 'u2.id': 'apply.currentApprovingSubUser' })
    .where('apply.id', applyId)
    .first();

  if (!result) {
    throw new createHttpError.NotFound('指定されたIDの申請が見つかりません');
  }

  const approvingUsers: apiif.UserInfoResponseData[] = [];

  if (result.currentApprovingMainUserId) {
    approvingUsers.push({
      id: result.currentApprovingMainUserId,
      account: result.currentApprovingMainUserAccount,
      name: result.currentApprovingMainUserName,
      email: result.currentApprovingMainUserEmail
    });
  }
  if (result.currentApprovingSubUserId) {
    approvingUsers.push({
      id: result.currentApprovingSubUserId,
      account: result.currentApprovingSubUserAccount,
      name: result.currentApprovingSubUserName,
      email: result.currentApprovingSubUserEmail
    });
  }

  return approvingUsers;
}

export async function addSchedules(this: DatabaseAccess, params: {
  userInfo: UserInfo, applyId: number, workPatternId?: number, dateFrom: Date, dateTo?: Date,
  leaveRate?: number, isPaid?: boolean
}) {

  const setTimeToZero = (date: Date) => {
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);
  }

  const dayFrom = new Date(params.dateFrom);
  setTimeToZero(dayFrom);
  const schedules = [{
    date: dayFrom, apply: params.applyId, isWorking: params.workPatternId !== undefined,
    dayAmount: params.leaveRate ? Math.abs(params.leaveRate) : 1.0,
    isPaid: params.isPaid, user: params.userInfo.id
  }];

  // 終日休暇では無い場合は、その日の勤務体系を再設定する必要があるので、取得する
  const workPatternCalendar = await this.getUserWorkPatternCalendar(params.userInfo, {
    from: format(dayFrom, 'isoDate'),
    to: format(params.dateTo ?? params.dateFrom, 'isoDate')
  });

  const dayFromWorkPattern = workPatternCalendar.find(workPattern => workPattern.date === format(dayFrom, 'isoDate'));
  const userWorkPatternCalendars = [{
    user: params.userInfo.id,
    // 休日出勤等で勤務体系が指定されている場合はその勤務体系にて設定する。
    // 勤務体系が指定されておらず、かつ終日休暇で無い場合はその日の現状の勤務体系とする。
    // 勤務体系が指定されておらず、かつ終日休暇の場合は勤務体系を無し(NULL)とする
    workPattern: params.workPatternId ?? (params.leaveRate ? dayFromWorkPattern?.workPattern?.id : null),
    date: dayFrom,
    leaveRate: params.leaveRate ?? null
  }];

  if (params.dateTo) {
    const dayTo = new Date(params.dateTo);
    setTimeToZero(dayTo);
    const numberOfDays = (dayTo.getTime() - dayFrom.getTime()) / (1000 * 60 * 60 * 24);

    if (numberOfDays < 0) {
      throw new createHttpError.BadRequest('日付範囲が不正である為、スケジュール登録できません。');
    }

    for (let i = 1; i <= numberOfDays; i++) {
      const day = new Date(dayFrom);
      day.setDate(day.getDate() + i);

      schedules.push({
        date: day, apply: params.applyId, isWorking: params.workPatternId !== undefined,
        dayAmount: params.leaveRate ? Math.abs(params.leaveRate) : 1.0,
        isPaid: params.isPaid, user: params.userInfo.id
      });

      const dayWorkPattern = workPatternCalendar.find(workPattern => workPattern.date === format(day, 'isoDate'));
      userWorkPatternCalendars.push({
        user: params.userInfo.id,
        workPattern: params.workPatternId ?? (params.leaveRate ? dayWorkPattern?.workPattern?.id : null),
        date: day,
        leaveRate: params.leaveRate ?? null
      });
    }
  }
  await this.knex('schedule').insert(schedules);
  await this.knex('userWorkPatternCalendar').insert(userWorkPatternCalendars).onConflict(['user', 'date']).merge(['workPattern', 'leaveRate']);
}

export async function approveApply(this: DatabaseAccess, userInfo: UserInfo, applyId: number, approve: boolean = true) {

  const apply = await this.knex.select<{
    applyId: number, isApproved: boolean, applyTypeName: string,
    applyDate: Date, applyDateTimeFrom: Date, applyDateTimeTo: Date,
    targetUserId: number, targetUserAccount: string,
    approvalLevel1MainUser: number, approvalLevel1SubUser: number,
    approvalLevel2MainUser: number, approvalLevel2SubUser: number,
    approvalLevel3MainUser: number, approvalLevel3SubUser: number,
    approvalDecisionUser: number,
    currentApprovingMainUser: number, currentApprovingSubUser: number,
    workPatternId: number
  }[]>({
    applyId: 'apply.id', isApproved: 'apply.isApproved', applyTypeName: 'applyType.name',
    applyDate: 'apply.date', applyDateTimeFrom: 'apply.dateTimeFrom', applyDateTimeTo: 'apply.dateTimeTo',
    targetUserId: 'apply.user', targetUserAccount: 'user.account',
    approvalLevel1MainUser: 'approvalRoute.approvalLevel1MainUser', approvalLevel1SubUser: 'approvalRoute.approvalLevel1SubUser',
    approvalLevel2MainUser: 'approvalRoute.approvalLevel2MainUser', approvalLevel2SubUser: 'approvalRoute.approvalLevel2SubUser',
    approvalLevel3MainUser: 'approvalRoute.approvalLevel3MainUser', approvalLevel3SubUser: 'approvalRoute.approvalLevel3SubUser',
    approvalDecisionUser: 'approvalRoute.approvalDecisionUser',
    currentApprovingMainUser: 'apply.currentApprovingMainUser', currentApprovingSubUser: 'apply.currentApprovingSubUser',
    workPatternId: 'apply.workPattern'
  })
    .from('apply')
    .leftJoin('user', { 'user.id': 'apply.user' })
    .leftJoin('applyType', { 'applyType.id': 'apply.type' })
    .leftJoin('approvalRoute', { 'approvalRoute.id': 'apply.route' })
    .where('apply.id', applyId)
    .first();

  if (!apply) {
    throw new createHttpError.NotFound(`指定された申請ID ${applyId} が見つかりません`);
  }

  if (apply.isApproved !== null) {
    throw new createHttpError.Forbidden('回付が完了しています');
  }

  let isApproved: boolean | undefined = approve;

  // 自分が承認者1の場合
  if (userInfo.id === apply.approvalLevel1MainUser || userInfo.id === apply.approvalLevel1SubUser) {
    let currentApprovingMainUser: number | null = null;
    let currentApprovingSubUser: number | null = null;

    if (apply.approvalLevel2MainUser || apply.approvalLevel2SubUser) {
      currentApprovingMainUser = apply.approvalLevel2MainUser;
      currentApprovingSubUser = apply.approvalLevel2SubUser;
    }
    else if (apply.approvalLevel3MainUser || apply.approvalLevel3SubUser) {
      currentApprovingMainUser = apply.approvalLevel3MainUser;
      currentApprovingSubUser = apply.approvalLevel3SubUser;
    }
    else {
      currentApprovingMainUser = apply.approvalDecisionUser;
      currentApprovingSubUser = null;
    }

    // 否認の場合は後続の承認者の有無に関わらず否認扱いとする
    // 承認者2〜3か決裁者がいないのであれば承認扱いとする
    isApproved = approve === true ? ((currentApprovingMainUser || currentApprovingSubUser) ? undefined : true) : false;

    await this.knex('apply').where('id', applyId).update({
      approvedLevel1User: userInfo.id,
      approvedLevel1UserTimestamp: new Date(),
      currentApprovingMainUser: approve === true ? currentApprovingMainUser : null,
      currentApprovingSubUser: approve === true ? currentApprovingSubUser : null,
      isApproved: isApproved
    });
  }
  // 自分が承認者2の場合
  else if (userInfo.id === apply.approvalLevel2MainUser || userInfo.id === apply.approvalLevel2SubUser) {
    let currentApprovingMainUser: number | null = null;
    let currentApprovingSubUser: number | null = null;

    if (apply.approvalLevel3MainUser || apply.approvalLevel3SubUser) {
      currentApprovingMainUser = apply.approvalLevel3MainUser;
      currentApprovingSubUser = apply.approvalLevel3SubUser;
    }
    else {
      currentApprovingMainUser = apply.approvalDecisionUser;
      currentApprovingSubUser = null;
    }

    // 承認者3か決裁者がいないのであれば承認扱いとする
    isApproved = approve === true ? ((currentApprovingMainUser || currentApprovingSubUser) ? undefined : true) : false;

    await this.knex('apply').where('id', applyId).update({
      approvedLevel2User: userInfo.id,
      approvedLevel2UserTimestamp: new Date(),
      currentApprovingMainUser: approve === true ? currentApprovingMainUser : null,
      currentApprovingSubUser: approve === true ? currentApprovingSubUser : null,
      isApproved: isApproved
    });
  }
  // 自分が承認者3の場合
  else if (userInfo.id === apply.approvalLevel3MainUser || userInfo.id === apply.approvalLevel3SubUser) {
    // 決裁者がいないのであれば承認扱いとする
    isApproved = approve === true ? (apply.approvalDecisionUser ? undefined : true) : false;

    await this.knex('apply').where('id', applyId).update({
      approvedLevel3User: userInfo.id,
      approvedLevel3UserTimestamp: new Date(),
      currentApprovingMainUser: approve === true ? (apply.approvalDecisionUser) : null,
      currentApprovingSubUser: null,
      isApproved: isApproved
    });
  }
  // 自分が決裁者の場合
  else if (userInfo.id === apply.approvalDecisionUser) {
    await this.knex('apply').where('id', applyId).update({
      approvedDecisionUser: userInfo.id,
      approvedDecisionUserTimestamp: new Date(),
      currentApprovingMainUser: null,
      currentApprovingSubUser: null,
      isApproved: approve // 決裁者の承認/否認で完了とする
    });
  }
  // 承認ルートに自分が含まれていない場合はエラー
  else {
    throw new createHttpError.Forbidden('承認ルートに含まれていません');
  }

  // 承認された場合は申請種類に応じた処理を行なう
  if (isApproved === true) {
    const targetUserInfo: UserInfo = { id: apply.targetUserId, account: apply.targetUserAccount };

    switch (apply.applyTypeName) {
      case 'record': // 打刻
        const recordOption = (await this.getApplyOptions([applyId])).find(applyOption => applyOption.optionTypeName === 'recordType');
        if (recordOption) {
          const targetUser = await this.getUserInfoById(apply.targetUserId);
          if (targetUser) {
            await this.submitRecord(
              userInfo, recordOption.optionValueName,
              { account: targetUser.account, timestamp: apply.applyDateTimeFrom, applyId: applyId }
            );
          }
        }
        break;
      case 'leave': // 有給
        await this.addSchedules({
          userInfo: targetUserInfo, applyId: applyId, dateFrom: apply.applyDateTimeFrom, dateTo: apply.applyDateTimeTo,
          isPaid: true
        });
        break;
      case 'mourning-leave': // 慶弔休
      case 'measure-leave': // 措置休
      case 'makeup-leave': // 代休
        await this.addSchedules({
          userInfo: targetUserInfo, applyId: applyId, dateFrom: apply.applyDateTimeFrom, dateTo: apply.applyDateTimeTo
        });
        break;
      case 'am-leave': // 午前半休
        await this.addSchedules({
          userInfo: targetUserInfo, applyId: applyId, dateFrom: apply.applyDateTimeFrom, dateTo: apply.applyDateTimeTo,
          leaveRate: 0.5, isPaid: true
        });
        break;
      case 'pm-leave': // 午後半休
        await this.addSchedules({
          userInfo: targetUserInfo, applyId: applyId, dateFrom: apply.applyDateTimeFrom, dateTo: apply.applyDateTimeTo,
          leaveRate: -0.5, isPaid: true
        });
        break;
      case 'holiday-work': // 休日出勤
        if (!apply.workPatternId) {
          throw new createHttpError.BadRequest('休日出勤での勤務体系が指定されていません。');
        }
        await this.addSchedules({
          userInfo: targetUserInfo, applyId: applyId, dateFrom: apply.applyDateTimeFrom, dateTo: apply.applyDateTimeTo,
          workPatternId: apply.workPatternId
        });
        break;
      case 'overtime': // 残業
        break;
      case 'lateness': // 遅刻
        break;
      case 'leave-early': // 早退
        break;
      case 'break': // 外出
        break;
    }
  }
}

export async function getEmailsOfApply(this: DatabaseAccess, applyId: number) {
  type ResultRecord = {
    targetUserEmail: string | null, appliedUserEmail: string | null, currentApprovingMainUserEmail: string | null, currentApprovingSubUserEmail: string | null,
  };

  const result = await this.knex.select<ResultRecord[]>({
    targetUserEmail: 'u0.email', appliedUserEmail: 'u1.email', currentApprovingMainUserEmail: 'u2.email', currentApprovingSubUserEmail: 'u3.email',
  })
    .from('apply')
    .leftJoin('user as u0', { 'u0.id': 'apply.user' })
    .leftJoin('user as u1', { 'u1.id': 'apply.appliedUser' })
    .leftJoin('user as u2', { 'u2.id': 'apply.currentApprovingMainUser' })
    .leftJoin('user as u3', { 'u3.id': 'apply.currentApprovingSubUser' })
    .where('apply.id', applyId)
    .first();

  return result as ResultRecord;
}

export async function sendApplyMail(this: DatabaseAccess, applyId: number, url?: string) {

  const result = await this.getEmailsOfApply(applyId);
  const mailSubject = await this.getSystemConfigValue('mailSubjectApply');
  const mailBody = await this.getSystemConfigValue('mailTemplateApply');

  // 全ての承認が完了している場合は、承認完了通知を申請者に送信する
  if (!result.currentApprovingMainUserEmail && !result.currentApprovingSubUserEmail) {
    await this.sendApplyApprovedMail(applyId, url);
  }
  // それ以外の場合は、次の承認者に承認依頼を送信する
  else {
    await this.queueMail({
      to: [result.currentApprovingMainUserEmail ?? undefined, result.currentApprovingSubUserEmail ?? undefined].join(','),
      subject: mailSubject ?? '',
      body: (mailBody ?? '') + (url ? ('\n\n' + url) : ''),
      replyTo: [result.targetUserEmail ?? undefined, result.appliedUserEmail ?? undefined].join(',')
    });
  }
}

export async function sendApplyRejectedMail(this: DatabaseAccess, applyId: number, url?: string) {

  const result = await this.getEmailsOfApply(applyId);
  const mailSubject = await this.getSystemConfigValue('mailSubjectReject');
  const mailBody = await this.getSystemConfigValue('mailTemplateReject');

  await this.queueMail({
    to: [result.targetUserEmail ?? undefined, result.appliedUserEmail ?? undefined].join(','),
    subject: mailSubject ?? '',
    body: (mailBody ?? '') + (url ? ('\n\n' + url) : ''),
    replyTo: [result.currentApprovingMainUserEmail ?? undefined, result.currentApprovingSubUserEmail ?? undefined].join(',')
  });
}

export async function sendApplyApprovedMail(this: DatabaseAccess, applyId: number, url?: string) {

  const result = await this.getEmailsOfApply(applyId);
  const mailSubject = await this.getSystemConfigValue('mailSubjectApproved');
  const mailBody = await this.getSystemConfigValue('mailTemplateApproved');

  await this.queueMail({
    to: [result.targetUserEmail ?? undefined, result.appliedUserEmail ?? undefined].join(','),
    subject: mailSubject ?? '',
    body: (mailBody ?? '') + (url ? ('\n\n' + url) : ''),
    replyTo: [result.currentApprovingMainUserEmail ?? undefined, result.currentApprovingSubUserEmail ?? undefined].join(',')
  });
}

///////////////////////////////////////////////////////////////////////
// 申請タイプ情報関連
///////////////////////////////////////////////////////////////////////
export async function getApplyTypes(this: DatabaseAccess) {

  const applyTypes = await this.knex
    .select<apiif.ApplyTypeResponseData[]>
    ({ id: 'id' }, { name: 'name' }, { isSystemType: 'isSystemType' }, { description: 'description' })
    .from('applyType');

  return applyTypes;
}

export async function addApplyType(this: DatabaseAccess, applyType: apiif.ApplyTypeRequestData) {

  await this.knex('applyType').insert(applyType)
    .onConflict(['id'])
    .merge(['name', 'isSystemType', 'description']); // ON DUPLICATE KEY UPDATE

  const lastApplyTypeResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
  if (!lastApplyTypeResult) {
    throw createHttpError(500, '', { internalMessage: 'MySQLの LAST_INSERT_ID() 実行に失敗しました' });
  }
  const lastApplyTypeId = lastApplyTypeResult['LAST_INSERT_ID()'];

  return lastApplyTypeId;
}

export async function updateApplyType(this: DatabaseAccess, applyType: apiif.ApplyTypeRequestData) {

  await this.knex('applyType').update(applyType).where('id', applyType.id);
}

export async function deleteApplyType(this: DatabaseAccess, name: string) {

  const applyTypeId = (await this.knex
    .select<apiif.ApplyTypeResponseData[]>({ id: 'id' }).from('applyType').where('name', name).first())?.id;

  if (!applyTypeId) {
    throw new createHttpError.NotFound(`指定された申請種類 ${name} が見つかりません`);
  }

  await this.knex.transaction(async (trx) => {
    await this.knex('applyPrivilege').del().where('type', applyTypeId);
    await this.knex('applyType').del().where('name', name);
  });
}

export async function getApplyOptionTypes(this: DatabaseAccess, applyType: string) {

  const optionTypes = await this.knex
    .select<{ typeName: string, typeDescription: string, optionName: string, optionDescription: string }[]>
    (
      { typeName: 'applyOptionType.name' }, { typeDescription: 'applyOptionType.description' },
      { optionName: 'applyOptionValue.name' }, { optionDescription: 'applyOptionValue.description' }
    )
    .from('applyOptionType')
    .join('applyType', { 'applyType.id': 'applyOptionType.type' })
    .join('applyOptionValue', { 'applyOptionValue.optionType': 'applyOptionType.id' })
    .where('applyType.name', applyType);

  const result: apiif.ApplyOptionsResponseData[] = [];

  for (const optionType of optionTypes) {
    const sameType = result.find((elem) => elem.name === optionType.typeName);
    if (!sameType) {
      result.push({
        name: optionType.typeName,
        description: optionType.typeDescription,
        options: [{
          name: optionType.optionName,
          description: optionType.optionDescription
        }]
      });
    }
    else {
      sameType.options.push({
        name: optionType.optionName,
        description: optionType.optionDescription
      });
    }
  }

  return result;
}
