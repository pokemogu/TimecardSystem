import { DatabaseAccess } from '../dataaccess';
import type { UserInfo } from '../dataaccess';
import * as apiif from 'shared/APIInterfaces';
import createHttpError from 'http-errors';

///////////////////////////////////////////////////////////////////////
// 申請関連
///////////////////////////////////////////////////////////////////////
export async function submitApply(this: DatabaseAccess, userInfo: UserInfo, applyType: string, apply: apiif.ApplyRequestBody) {

  const applyTypeInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('applyType').where('name', applyType).first();
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
    .from('approvalRoute').where('name', apply.route).first();
  if (!routeInfo) {
    throw new Error(`invalid route name ${apply.route} specified`);
  }

  await this.knex('apply').insert({
    type: applyTypeInfo.id,
    user: userId,
    appliedUser: userInfo.id,
    timestamp: new Date(apply.timestamp),
    date: apply.date,
    dateTimeFrom: new Date(apply.dateTimeFrom),
    dateTimeTo: apply.dateTimeTo ? new Date(apply.dateTimeTo) : undefined,
    dateRelated: apply.dateRelated ? new Date(apply.dateRelated) : undefined,
    reason: apply.reason ? apply.reason : undefined,
    contact: apply.contact ? apply.contact : undefined,
    route: routeInfo.id,
    currentApprovingMainUser:
      routeInfo.approvalLevel1MainUser ?? routeInfo.approvalLevel2MainUser ?? routeInfo.approvalLevel2MainUser ?? routeInfo.approvalDecisionUser,
    currentApprovingSubUser:
      routeInfo.approvalLevel1SubUser ?? routeInfo.approvalLevel2SubUser ?? routeInfo.approvalLevel2SubUser
  });

  const lastApplyResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
  const lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

  // オプション指定があれば合わせて保存する
  if (apply.options) {
    const applyOptionTypeInfo = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('applyOptionType')
    const applyOptionValueInfo = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('applyOptionValue')

    const applyOptions: { apply: number, optionType: number, optionValue: number }[] = [];
    for (const option of apply.options) {
      applyOptions.push({
        apply: lastApplyId,
        optionType: applyOptionTypeInfo.find(info => info.name === option.name).id,
        optionValue: applyOptionValueInfo.find(info => info.name === option.value).id
      });
    }
    await this.knex('applyOption').insert(applyOptions);
  }

  return lastApplyId;
}

export async function getApplyTypeOfApply(this: DatabaseAccess, accessToken: string, applyId: number) {

  const result = await this.knex.select<{ typeId: number, typeName: string, typeDescription: string, isSystemType: boolean }[]>({
    id: 'apply.id', typeName: 'applyType.name', typeDescription: 'applyType.description', isSystemType: 'applyType.isSystemType'
  })
    .from('apply')
    .leftJoin('applyType', { 'applyType.id': 'apply.type' })
    .where('apply.id', applyId)
    .first();

  return <apiif.ApplyTypeResponseData>{
    id: result.typeId,
    name: result.typeName,
    description: result.typeDescription,
    isSystemType: result.isSystemType
  }
}

export async function getApply(this: DatabaseAccess, applyId: number) {

  const result = await this.knex.select<{
    id: number, timestamp: Date, typeName: string, typeDescription: string,
    targetUserId: number, targetUserAccount: string, targetUserName: string, targetUserEmail: string,
    appliedUserId: number, appliedUserAccount: string, appliedUserName: string, appliedUserEmail: string,
    approvedLevel1UserId: number, approvedLevel1UserAccount: string, approvedLevel1UserName: string, approvedLevel1Timestamp: Date,
    approvedLevel2UserId: number, approvedLevel2UserAccount: string, approvedLevel2UserName: string, approvedLevel2Timestamp: Date,
    approvedLevel3UserId: number, approvedLevel3UserAccount: string, approvedLevel3UserName: string, approvedLevel3Timestamp: Date,
    approvedDecisionUserId: number, approvedDecisionUserAccount: string, approvedDecisionUserName: string, approvedDecisionTimestamp: Date,
    date: Date, dateTimeFrom: Date, dateTimeTo: Date, dateRelated: Date,
    reason: string, contact: string, routeName: string, isApproved: boolean
  }[]>({
    id: 'apply.id', timestamp: 'apply.timestamp', typeName: 'applyType.name', typeDescription: 'applyType.description',
    targetUserId: 'u0.id', targetUserAccount: 'u0.account', targetUserName: 'u0.name', targetUserEmail: 'u0.email',
    appliedUserId: 'u1.id', appliedUserAccount: 'u1.account', appliedUserName: 'u1.name', appliedUserEmail: 'u1.email',
    approvedLevel1UserId: 'u2.id', approvedLevel1UserAccount: 'u2.account', approvedLevel1UserName: 'u2.name', approvedLevel1Timestamp: 'apply.approvedLevel1UserTimestamp',
    approvedLevel2UserId: 'u3.id', approvedLevel2UserAccount: 'u3.account', approvedLevel2UserName: 'u3.name', approvedLevel2Timestamp: 'apply.approvedLevel2UserTimestamp',
    approvedLevel3UserId: 'u4.id', approvedLevel3UserAccount: 'u4.account', approvedLevel3UserName: 'u4.name', approvedLevel3Timestamp: 'apply.approvedLevel3UserTimestamp',
    approvedDecisionUserId: 'u5.id', approvedDecisionUserAccount: 'u5.account', approvedDecisionUserName: 'u5.name', approvedDecisionTimestamp: 'apply.approvedDecisionUserTimestamp',
    date: 'apply.date', dateTimeFrom: 'apply.dateTimeFrom', dateTimeTo: 'apply.dateTimeTo', dateRelated: 'apply.dateRelated',
    reason: 'apply.reason', contact: 'apply.contact', routeName: 'approvalRoute.name', isApproved: 'apply.isApproved'
  })
    .from('apply')
    .leftJoin('applyType', { 'applyType.id': 'apply.type' })
    .leftJoin('approvalRoute', { 'approvalRoute.id': 'apply.route' })
    .leftJoin('user as u0', { 'u0.id': 'apply.user' })
    .leftJoin('user as u1', { 'u1.id': 'apply.appliedUser' })
    .leftJoin('user as u2', { 'u2.id': 'apply.approvedLevel1User' })
    .leftJoin('user as u3', { 'u3.id': 'apply.approvedLevel2User' })
    .leftJoin('user as u4', { 'u4.id': 'apply.approvedLevel3User' })
    .leftJoin('user as u5', { 'u5.id': 'apply.approvedDecisionUser' })
    .where('apply.id', applyId)
    .first();

  return <apiif.ApplyResponseData>{
    id: result.id, timestamp: result.timestamp.toISOString(),
    type: {
      name: result.typeName,
      description: result.typeDescription
    },

    targetUser: {
      id: result.targetUserId,
      account: result.targetUserAccount,
      name: result.targetUserName,
      email: result.targetUserEmail
    },

    appliedUser: result.appliedUserId ? {
      id: result.appliedUserId,
      account: result.appliedUserAccount,
      name: result.appliedUserName,
      email: result.appliedUserEmail
    } : undefined,

    approvedLevel1User: result.approvedLevel1UserId ? {
      id: result.approvedLevel1UserId,
      account: result.approvedLevel1UserAccount,
      name: result.approvedLevel1UserName
    } : undefined,
    approvedLevel1Timestamp: result.approvedLevel1Timestamp ? result.approvedLevel1Timestamp.toISOString() : undefined,

    approvedLevel2User: result.approvedLevel2UserId ? {
      id: result.approvedLevel2UserId,
      account: result.approvedLevel2UserAccount,
      name: result.approvedLevel2UserName
    } : undefined,
    approvedLevel2Timestamp: result.approvedLevel2Timestamp ? result.approvedLevel2Timestamp.toISOString() : undefined,

    approvedLevel3User: result.approvedLevel3UserId ? {
      id: result.approvedLevel3UserId,
      account: result.approvedLevel3UserAccount,
      name: result.approvedLevel3UserName
    } : undefined,
    approvedLevel3Timestamp: result.approvedLevel3Timestamp ? result.approvedLevel3Timestamp.toISOString() : undefined,

    approvedDecisionUser: result.approvedDecisionUserId ? {
      id: result.approvedDecisionUserId,
      account: result.approvedDecisionUserAccount,
      name: result.approvedDecisionUserName
    } : undefined,
    approvedDecisionTimestamp: result.approvedDecisionTimestamp ? result.approvedDecisionTimestamp.toISOString() : undefined,

    date: result.date.toISOString(),
    dateTimeFrom: result.dateTimeFrom.toISOString(),
    dateTimeTo: result.dateTimeTo ? result.dateTimeTo.toISOString() : undefined,
    dateRelated: result.dateRelated ? result.dateRelated.toISOString() : undefined,
    reason: result.reason ?? undefined,
    contact: result.contact ?? undefined,
    routeName: result.routeName ?? undefined,
    isApproved: result.isApproved
  }
}


export async function getApplyCurrentApprovingUsers(this: DatabaseAccess, applyId: number) {

  const result = await this.knex.select<{
    approvedLevel1UserId: number, approvedLevel1UserAccount: string, approvedLevel1UserName: string, approvedLevel1UserEmail: string,
    approvedLevel2UserId: number, approvedLevel2UserAccount: string, approvedLevel2UserName: string, approvedLevel2UserEmail: string
  }[]>({
    approvedLevel1UserId: 'u1.id', approvedLevel1UserAccount: 'u1.account', approvedLevel1UserName: 'u1.name', approvedLevel1UserEmail: 'u1.email',
    approvedLevel2UserId: 'u2.id', approvedLevel2UserAccount: 'u2.account', approvedLevel2UserName: 'u2.name', approvedLevel2UserEmail: 'u2.email'
  })
    .from('apply')
    .leftJoin('user as u1', { 'u1.id': 'apply.currentApprovingMainUser' })
    .leftJoin('user as u2', { 'u2.id': 'apply.currentApprovingSubUser' })
    .where('apply.id', applyId)
    .first();

  return <apiif.UserInfoResponseData[]>[
    result.approvedLevel1UserId ? {
      id: result.approvedLevel1UserId,
      account: result.approvedLevel1UserAccount,
      name: result.approvedLevel1UserName,
      email: result.approvedLevel1UserEmail
    } : undefined,
    result.approvedLevel2UserId ? {
      id: result.approvedLevel2UserId,
      account: result.approvedLevel2UserAccount,
      name: result.approvedLevel2UserName,
      email: result.approvedLevel2UserEmail
    } : undefined
  ];
}


export async function approveApply(this: DatabaseAccess, userInfo: UserInfo, applyId: number, approve: boolean = true) {

  const apply = await this.knex.select<{
    applyId: number, isApproved: boolean,
    approvalLevel1MainUser: number, approvalLevel1SubUser: number,
    approvalLevel2MainUser: number, approvalLevel2SubUser: number,
    approvalLevel3MainUser: number, approvalLevel3SubUser: number,
    approvalDecisionUser: number
  }>({
    applyId: 'apply.id', isApproved: 'apply.isApproved',
    approvalLevel1MainUser: 'approvalRoute.approvalLevel1MainUser', approvalLevel1SubUser: 'approvalRoute.approvalLevel1SubUser',
    approvalLevel2MainUser: 'approvalRoute.approvalLevel2MainUser', approvalLevel2SubUser: 'approvalRoute.approvalLevel2SubUser',
    approvalLevel3MainUser: 'approvalRoute.approvalLevel3MainUser', approvalLevel3SubUser: 'approvalRoute.approvalLevel3SubUser',
    approvalDecisionUser: 'approvalRoute.approvalDecisionUser'
  })
    .from('apply')
    .leftJoin('applyType', { 'applyType.id': 'apply.type' })
    .leftJoin('approvalRoute', { 'approvalRoute.id': 'apply.route' })
    .where('id', applyId)

  // 自分が承認者1の場合
  if (userInfo.id === apply.approvalLevel1MainUser || userInfo.id === apply.approvalLevel1SubUser) {
    let currentApprovingMainUser: number = null;
    let currentApprovingSubUser: number = null;

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

    await this.knex('apply').where('id', applyId).update({
      approvedLevel1User: approve === true ? userInfo.id : undefined,
      approvedLevel1UserTimestamp: approve === true ? new Date() : undefined,
      currentApprovingMainUser: approve === true ? currentApprovingMainUser : userInfo.id,
      currentApprovingSubUser: approve === true ? currentApprovingSubUser : null,
      // 承認者2〜3か決裁者がいないのであれば承認扱いとする
      isApproved: approve === true ? ((currentApprovingMainUser || currentApprovingSubUser) ? undefined : true) : false // 否認の場合は後続の承認者の有無に関わらず否認扱いとする
    });
  }
  // 自分が承認者2の場合
  else if (userInfo.id === apply.approvalLevel2MainUser || userInfo.id === apply.approvalLevel2SubUser) {
    let currentApprovingMainUser: number = null;
    let currentApprovingSubUser: number = null;

    if (apply.approvalLevel3MainUser || apply.approvalLevel3SubUser) {
      currentApprovingMainUser = apply.approvalLevel3MainUser;
      currentApprovingSubUser = apply.approvalLevel3SubUser;
    }
    else {
      currentApprovingMainUser = apply.approvalDecisionUser;
      currentApprovingSubUser = null;
    }

    await this.knex('apply').where('id', applyId).update({
      approvedLevel2User: approve === true ? userInfo.id : undefined,
      approvedLevel2UserTimestamp: approve === true ? new Date() : undefined,
      currentApprovingMainUser: approve === true ? currentApprovingMainUser : userInfo.id,
      currentApprovingSubUser: approve === true ? currentApprovingSubUser : null,
      // 承認者3か決裁者がいないのであれば承認扱いとする
      isApproved: approve === true ? ((currentApprovingMainUser || currentApprovingSubUser) ? undefined : true) : false
    });
  }
  // 自分が承認者3の場合
  else if (userInfo.id === apply.approvalLevel3MainUser || userInfo.id === apply.approvalLevel3SubUser) {
    await this.knex('apply').where('id', applyId).update({
      approvedLevel3User: approve === true ? userInfo.id : undefined,
      approvedLevel3UserTimestamp: approve === true ? new Date() : undefined,
      currentApprovingMainUser: approve === true ? (apply.approvalDecisionUser) : userInfo.id,
      currentApprovingSubUser: null,
      // 決裁者がいないのであれば承認扱いとする
      isApproved: approve === true ? (apply.approvalDecisionUser ? undefined : true) : false
    });
  }
  // 自分が決裁者の場合
  else if (userInfo.id === apply.approvalDecisionUser) {
    await this.knex('apply').where('id', applyId).update({
      approvedDecisionUser: approve === true ? userInfo.id : undefined,
      approvedDecisionUserTimestamp: approve === true ? new Date() : undefined,
      currentApprovingMainUser: null,
      currentApprovingSubUser: null,
      isApproved: approve // 決裁者の承認/否認で完了とする
    });
  }
  // 承認ルートに自分が含まれていない場合はエラー
  else {
    throw new createHttpError.Forbidden('承認ルートに含まれていません');
  }
}

export async function getUnapprovedApplies(this: DatabaseAccess, accessToken: string) {

}

export async function getRejectedApplies(this: DatabaseAccess, accessToken: string) {

}

export async function getMyApprovedApplies(this: DatabaseAccess, accessToken: string) {

}

export async function getEmailsOfApply(this: DatabaseAccess, applyId: number) {

  return await this.knex.select<{
    targetUserEmail: string, appliedUserEmail: string, currentApprovingMainUserEmail: string, currentApprovingSubUserEmail: string,
  }[]>({
    targetUserEmail: 'u0.email', appliedUserEmail: 'u1.email', currentApprovingMainUserEmail: 'u2.email', currentApprovingSubUserEmail: 'u3.email',
  })
    .from('apply')
    .leftJoin('user as u0', { 'u0.id': 'apply.user' })
    .leftJoin('user as u1', { 'u1.id': 'apply.appliedUser' })
    .leftJoin('user as u2', { 'u2.id': 'apply.currentApprovingMainUser' })
    .leftJoin('user as u3', { 'u3.id': 'apply.currentApprovingSubUser' })
    .where('apply.id', applyId)
    .first();
}

export async function sendApplyMail(this: DatabaseAccess, applyId: number, url?: string) {

  const result = await this.getEmailsOfApply(applyId);
  const mailSubject = await this.getSystemConfigValue('mailSubjectApply');
  const mailBody = await this.getSystemConfigValue('mailTemplateApply');

  await this.queueMail({
    to: [result.currentApprovingMainUserEmail ?? undefined, result.currentApprovingSubUserEmail ?? undefined].join(','),
    subject: mailSubject ?? '',
    body: (mailBody ?? '') + (url ? ('\n\n' + url) : ''),
    replyTo: [result.targetUserEmail ?? undefined, result.appliedUserEmail ?? undefined].join(',')
  });
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
  const lastApplyTypeId = lastApplyTypeResult['LAST_INSERT_ID()'];

  return lastApplyTypeId;
}

export async function updateApplyType(this: DatabaseAccess, applyType: apiif.ApplyTypeRequestData) {

  await this.knex('applyType').update(applyType).where('id', applyType.id);
}

export async function deleteApplyType(this: DatabaseAccess, name: string) {

  const applyType = await this.knex
    .select<apiif.ApplyTypeResponseData[]>({ id: 'id' }).from('applyType').where('name', name).first();

  await this.knex.transaction(async (trx) => {
    await this.knex('applyPrivilege').del().where('type', applyType.id);
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
