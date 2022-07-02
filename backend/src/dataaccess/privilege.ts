import lodash from 'lodash';
import createHttpError from 'http-errors';

import { DatabaseAccess, UserInfo } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

///////////////////////////////////////////////////////////////////////
// 権限情報関連
///////////////////////////////////////////////////////////////////////
/*
export async function registerPrivilege(this: DatabaseAccess, accessToken: string, privilegeData: {

}) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  const privilege = lodash.omit(privilegeData, ['id']);

  await this.knex('privilege').insert(privilege);
}
*/

export async function getUserPrivilege(this: DatabaseAccess, account: string) {

  const result = await this.knex.select<apiif.PrivilegeResponseData[]>({
    id: 'privilege.id', name: 'privilege.name', recordByLogin: 'privilege.recordByLogin',
    maxApplyLateNum: 'privilege.maxApplyLateNum', maxApplyLateHours: 'privilege.maxApplyLateHours',
    maxApplyEarlyNum: 'privilege.maxApplyEarlyNum', maxApplyEarlyHours: 'privilege.maxApplyEarlyHours',
    approve: 'privilege.approve',
    viewRecord: 'privilege.viewRecord', viewRecordPerDevice: 'privilege.viewRecordPerDevice',
    configurePrivilege: 'privilege.configurePrivilege', configureWorkPattern: 'privilege.configureWorkPattern',
    issueQr: 'privilege.issueQr',
    registerUser: 'privilege.registerUser', registerDevice: 'privilege.registerDevice',
    viewAllUserInfo: 'privilege.viewAllUserInfo',
    viewDepartmentUserInfo: 'privilege.viewDepartmentUserInfo',
    viewSectionUserInfo: 'privilege.viewSectionUserInfo'
  })
    .from('privilege')
    .join('user', { 'user.privilege': 'privilege.id' })
    .where('user.account', account)
    .andWhere('privilege.isSystemPrivilege', false)
    .first();

  if (!result) {
    throw new createHttpError.NotFound('指定された名前の権限が見つかりません');
  }

  if (result.id) {
    result.applyPrivileges = await this.getApplyPrivilege(result.id);
  }

  return result;
}
/*
export async function getUserApplyPrivilege(this: DatabaseAccess, accessToken: string, idOrAccount: string | number) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  const results = await this.knex.select({
    applyTypeId: 'applyType.id', applyTypeName: 'applyType.name', applyTypeDescription: 'applyType.description',
    //userId: 'userId', userAccount: 'userAccount', userName: 'userName',
    isSystemType: this.knex.raw('if(isnull(applyPrivilegeExistingList.isSystemType), 0, applyPrivilegeExistingList.isSystemType)'),
    permitted: this.knex.raw('if(isnull(applyPrivilegeExistingList.permitted), 0, applyPrivilegeExistingList.permitted)')
  })
    .from('applyType')
    .leftJoin(

      this.knex.select({
        userId: 'user.id', userAccount: 'user.account', userName: 'user.name', applyTypeId: 'applyType.id',
        isSystemType: 'applyType.isSystemType', permitted: 'applyPrivilege.permitted'
      })
        .from('applyType')
        .join('applyPrivilege', { 'applyPrivilege.type': 'applyType.id' })
        .join('user', function (builder) {
          builder.on('user.privilege', 'applyPrivilege.privilege');
          if (typeof idOrAccount === 'string') {
            builder.andOnIn('user.account', [idOrAccount]);
          }
          else {
            builder.andOnIn('user.id', [idOrAccount]);
          }
        })
        .as('applyPrivilegeExistingList')

      , { 'applyType.id': 'applyPrivilegeExistingList.applyTypeId' });

  return results.map((result) => {
    return <apiif.ApplyPrivilegeResponseData>{
      applyTypeId: result.applyTypeId,
      applyTypeName: result.applyTypeName,
      applyTypeDescription: result.applyTypeDescription,
      permitted: result.permitted === 0 ? false : true,
      isSystemType: result.isSystemType === 0 ? false : true
    }
  });
}
*/
export async function getApplyPrivilege(this: DatabaseAccess, privilege: number) {

  const results = await this.knex.select({
    applyTypeId: 'applyType.id', applyTypeName: 'applyType.name', applyTypeDescription: 'applyType.description',
    isSystemType: 'applyType.isSystemType', permitted: this.knex.raw('if(isnull(applyPrivilege.permitted), 0, applyPrivilege.permitted)')
  })
    .from('applyType')
    .leftJoin('applyPrivilege', function (builder) {
      builder.on('applyPrivilege.type', 'applyType.id');
      builder.andOnIn('applyPrivilege.privilege', [privilege]);
    });

  return results.map((result) => {
    return <apiif.ApplyPrivilegeResponseData>{
      applyTypeId: result.applyTypeId,
      applyTypeName: result.applyTypeName,
      applyTypeDescription: result.applyTypeDescription,
      permitted: result.permitted === 0 ? false : true,
      isSystemType: result.isSystemType
    }
  });
}

export async function addPrivilege(this: DatabaseAccess, privilege: apiif.PrivilageRequestData) {

  const applyPrivileges: apiif.ApplyPrivilegeResponseData[] = [];
  if (privilege.applyPrivileges) {
    applyPrivileges.push(...privilege.applyPrivileges);
    //Array.prototype.push.apply(applyPrivileges, privilege.applyPrivileges);
  }

  const applyTypes = await this.getApplyTypes();

  await this.knex('privilege').insert(lodash.omit(privilege, ['id', 'applyPrivileges']));

  const privilegeLastIdResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
  if (!privilegeLastIdResult) {
    throw createHttpError(500, '', { internalMessage: 'MySQLの LAST_INSERT_ID() 実行に失敗しました' });
  }
  const privilegeLastId = privilegeLastIdResult['LAST_INSERT_ID()'];

  if (privilege.applyPrivileges && privilege.applyPrivileges.length > 0) {
    await this.knex('applyPrivilege').insert(applyPrivileges.map(applyPrivilege => {
      return {
        type: applyTypes.find(applyType => applyType.name === applyPrivilege.applyTypeName)?.id,
        privilege: privilegeLastId,
        permitted: applyPrivilege.permitted
      };
    }));
  }
}

export async function getPrivileges(this: DatabaseAccess) {
  //const results = await this.knex.table<apiif.PrivilegeResponseData>('privilege').where('isSystemPrivilege', false);
  const results = await this.knex.select<apiif.PrivilegeResponseData[]>({
    id: 'privilege.id', name: 'privilege.name', recordByLogin: 'privilege.recordByLogin',
    maxApplyLateNum: 'privilege.maxApplyLateNum', maxApplyLateHours: 'privilege.maxApplyLateHours',
    maxApplyEarlyNum: 'privilege.maxApplyEarlyNum', maxApplyEarlyHours: 'privilege.maxApplyEarlyHours',
    approve: 'privilege.approve',
    viewRecord: 'privilege.viewRecord', viewRecordPerDevice: 'privilege.viewRecordPerDevice',
    configurePrivilege: 'privilege.configurePrivilege', configureWorkPattern: 'privilege.configureWorkPattern',
    issueQr: 'privilege.issueQr',
    registerUser: 'privilege.registerUser', registerDevice: 'privilege.registerDevice',
    viewAllUserInfo: 'privilege.viewAllUserInfo',
    viewDepartmentUserInfo: 'privilege.viewDepartmentUserInfo',
    viewSectionUserInfo: 'privilege.viewSectionUserInfo'
  })
    .from('privilege')
    .where('isSystemPrivilege', false);

  for (const result of results) {
    if (result.id) {
      result.applyPrivileges = await this.getApplyPrivilege(result.id);
    }
  }

  return results;
}

export async function updatePrivilege(this: DatabaseAccess, privilege: apiif.PrivilageRequestData) {

  const applyPrivileges: apiif.ApplyPrivilegeResponseData[] = [];
  if (privilege.applyPrivileges) {
    applyPrivileges.push(...privilege.applyPrivileges);
    //Array.prototype.push.apply(applyPrivileges, privilege.applyPrivileges);
  }

  const applyTypes = await this.getApplyTypes();

  await this.knex('privilege').where('id', privilege.id).andWhere('isSystemPrivilege', false).update(lodash.omit(privilege, ['applyPrivileges']));

  await this.knex.transaction(async (trx) => {
    await this.knex('applyPrivilege').del().where('privilege', privilege.id).transacting(trx);
    await this.knex('applyPrivilege').insert(applyPrivileges.map(applyPrivilege => {
      return {
        type: applyTypes.find(applyType => applyType.name === applyPrivilege.applyTypeName)?.id,
        privilege: privilege.id,
        permitted: applyPrivilege.permitted
      };
    })).transacting(trx);
  });
  //    .onConflict(['type', 'privilege'])
  //    .merge(['permitted']); // ON DUPLICATE KEY UPDATE
}

export async function deletePrivilege(this: DatabaseAccess, id: number) {
  try {
    await this.knex.transaction(async (trx) => {
      await this.knex('applyPrivilege').del().where('privilege', id).transacting(trx);
      await this.knex('privilege').del().where('id', id).andWhere('isSystemPrivilege', false).transacting(trx);
    });
  }
  catch (error: unknown) {
    if (error instanceof Error && error.toString().includes('foreign key constraint fails')) {
      throw createHttpError(403, 'この権限を使用しているユーザーがいる為、削除できません', { internalMessage: (error as Error).message });
    }
    else {
      throw error;
    }
  }
}

export async function checkPrivilege(this: DatabaseAccess, userInfo?: UserInfo, privilegeType?: keyof apiif.Privilege) {
  // ログイン済みかどうかは必ずチェックする
  if (!userInfo) {
    throw new createHttpError.Unauthorized('ログインが必要です');
  }
  // 権限チェックを行なう
  if (privilegeType) {
    const privilege = await this.getUserPrivilege(userInfo.account);
    if (!privilege[privilegeType]) {
      throw new createHttpError.Forbidden('権限がありません');
    }
  }
  return userInfo;
}
