import lodash from 'lodash';
import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';
import type * as models from 'shared/models';

///////////////////////////////////////////////////////////////////////
// 権限情報関連
///////////////////////////////////////////////////////////////////////
export async function registerPrivilege(this: DatabaseAccess, privilegeData: {

}) {
  const privilege = lodash.omit(privilegeData, ['id']);

  await this.knex('privilege').insert(privilege);
}

export async function getUserPrivilege(this: DatabaseAccess, idOrAccount: string | number): Promise<models.Privilege> {
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

export async function addPrivilege(this: DatabaseAccess, accessToken: string, privilege: apiif.PrivilageRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  lodash.omit(privilege, ['id']);
  await this.knex('privilege').insert(privilege);
}

export async function getPrivileges(this: DatabaseAccess) {
  return await this.knex.table<apiif.PrivilegeResponseData>('privilege');
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
