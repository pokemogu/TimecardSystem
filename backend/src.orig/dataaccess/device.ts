import type * as apiif from 'shared/APIInterfaces';
import { DatabaseAccess } from '../dataaccess';

///////////////////////////////////////////////////////////////////////
// デバイス情報関連
///////////////////////////////////////////////////////////////////////
export async function getDevices(this: DatabaseAccess, accessToken: string, params?: { limit?: number, offset?: number }) {
  return (await this.knex.select<apiif.DeviceResponseData[]>
    ({ id: 'id', account: 'account', name: 'name' })
    .from('user')
    .where('available', true)
    .andWhere('isDevice', true)
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.registeredAt', 'desc')) as apiif.DeviceResponseData[];
}

export async function getDeviceRefreshToken(this: DatabaseAccess, accessToken: string, deviceAccout: string) {
  const result = await this.knex.select<{ refreshToken: string }[]>
    ({ refreshToken: 'token.refreshToken' })
    .from('user')
    .leftJoin('token', { 'token.user': 'user.id' })
    .where('user.account', deviceAccout)
    .andWhere('user.available', true)
    .andWhere('user.isDevice', true)
    .first();

  return result.refreshToken as string;
}

export async function addDevice(this: DatabaseAccess, accessToken: string, device: apiif.DeviceRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  const privilegeIdDevice = (await this.knex.select<{ id: number }[]>({ id: 'id' })
    .from('privilege')
    .where('name', '__SYSTEM_DEVICE_PRIVILEGE__')
    .first()
  ).id;

  await this.knex('user').insert({
    available: true, registeredAt: new Date(),
    account: device.account, name: device.name,
    privilege: privilegeIdDevice,
    isDevice: true
  });

  /*
  const lastUserResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
  const lastUserId = lastUserResult['LAST_INSERT_ID()'];

  const secondsPerDay = 60 * 60 * 24;
  let refreshToken = issueRefreshToken({ account: device.account }, secondsPerDay * 3650);
  await this.knex('token').insert({ user: lastUserId, refreshToken: refreshToken, isQrToken: true });
  */
}

export async function updateDevice(this: DatabaseAccess, accessToken: string, device: apiif.DeviceRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  await this.knex('user')
    .where('account', device.account)
    .andWhere('available', true)
    .andWhere('isDevice', true)
    .update({ name: device.name });
}

export async function deleteDevice(this: DatabaseAccess, accessToken: string, deviceAccount: string) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  const deviceUserId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', deviceAccount).first()).id;

  await this.knex('token')
    .where('user', deviceUserId)
    .del();

  await this.knex('user')
    .where('account', deviceAccount)
    .andWhere('available', true)
    .andWhere('isDevice', true)
    .del();
}
