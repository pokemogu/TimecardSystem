import lodash from 'lodash';
import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';
import type * as models from 'shared/models';

///////////////////////////////////////////////////////////////////////
// 権限情報関連
///////////////////////////////////////////////////////////////////////
export async function registerPrivilege(this: DatabaseAccess, accessToken: string, privilegeData: {

}) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  const privilege = lodash.omit(privilegeData, ['id']);

  await this.knex('privilege').insert(privilege);
}

export async function getUserPrivilege(this: DatabaseAccess, accessToken: string, idOrAccount: string | number): Promise<models.Privilege> {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  if (typeof idOrAccount === 'string') {
    return await this.knex.table<models.Privilege>('privilege')
      .first()
      .join('user', { 'user.privilege': 'privilege.id' })
      .where('user.account', idOrAccount);
  }
  else {
    return await this.knex.table<models.Privilege>('privilege')
      .first()
      .join('user', { 'user.privilege': 'privilege.id' })
      .where('user.id', idOrAccount);
  }
}

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

export async function getApplyPrivilege(this: DatabaseAccess, accessToken: string, privilege: number) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  const results = await this.knex.select({
    applyTypeId: 'applyType.id', applyTypeName: 'applyType.name', applyTypeDescription: 'applyType.description',
    isSystemType: 'applyType.isSystemType', permitted: this.knex.raw('if(isnull(applyPrivilege.permitted), 0, applyPrivilege.permitted)')
  })
    .from('applyType')
    .leftJoin('applyPrivilege', function (builder) {
      builder.on('applyPrivilege.type', 'applyType.id');
      builder.andOnIn('applyPrivilege.privilege', [privilege]);
    });

  console.log(results);

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

export async function addPrivilege(this: DatabaseAccess, accessToken: string, privilege: apiif.PrivilageRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  lodash.omit(privilege, ['id']);
  await this.knex('privilege').insert(privilege);
}

export async function getPrivileges(this: DatabaseAccess) {
  const result = await this.knex.table<apiif.PrivilegeResponseData>('privilege');

  return result;
}

export async function updatePrivilege(this: DatabaseAccess, accessToken: string, privilege: apiif.PrivilageRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  const id = privilege.id;
  lodash.omit(privilege, ['id']);

  await this.knex('privilege')
    .where('id', id)
    .update(privilege);
}

export async function deletePrivilege(this: DatabaseAccess, accessToken: string, idOrName: string | number) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  if (typeof idOrName === 'string') {
    return await this.knex('privilege').del().where('name', idOrName);
  }
  else {
    return await this.knex('privilege').del().where('id', idOrName);
  }
}
