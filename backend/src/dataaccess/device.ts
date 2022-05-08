import createHttpError from 'http-errors';

import type * as apiif from '../APIInterfaces';
import { DatabaseAccess } from '../dataaccess';

///////////////////////////////////////////////////////////////////////
// デバイス情報関連
///////////////////////////////////////////////////////////////////////
export async function getDevices(this: DatabaseAccess, params?: { limit?: number, offset?: number }) {

  return (await this.knex.select<apiif.DeviceResponseData[]>
    ({ id: 'id', account: 'account', name: 'name' })
    .from('user')
    .where('available', true)
    .andWhere('isDevice', true)
    .modify(function (builder) {
      if (params?.limit) {
        builder.limit(params.limit);
      }
      if (params?.offset) {
        builder.offset(params.offset);
      }
    })
    .orderBy('user.registeredAt', 'desc')) as apiif.DeviceResponseData[];
}

export async function getDeviceRefreshToken(this: DatabaseAccess, deviceAccout: string) {

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

export async function addDevice(this: DatabaseAccess, device: apiif.DeviceRequestData) {

  const privilegeIdDevice = (await this.knex.select<{ id: number }[]>({ id: 'id' })
    .from('privilege')
    .where('name', '__SYSTEM_DEVICE_PRIVILEGE__')
    .first()
  )?.id;

  if (!privilegeIdDevice) {
    throw createHttpError(500, '内部エラーです', { internalMessage: '機器用の内部権限である __SYSTEM_DEVICE_PRIVILEGE__ が見つかりません' });
  }

  await this.knex('user').insert({
    available: true, registeredAt: new Date(),
    account: device.account, name: device.name,
    privilege: privilegeIdDevice,
    isDevice: true
  });
}

export async function updateDevice(this: DatabaseAccess, device: apiif.DeviceRequestData) {

  await this.knex('user')
    .where('account', device.account)
    .andWhere('available', true)
    .andWhere('isDevice', true)
    .update({ name: device.name });
}

export async function deleteDevice(this: DatabaseAccess, deviceAccount: string) {

  const deviceUserId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', deviceAccount).first())?.id;

  if (!deviceUserId) {
    throw new createHttpError.NotFound(`指定された機器ID ${deviceAccount} が見つかりません`);
  }

  await this.knex('token')
    .where('user', deviceUserId)
    .del();

  await this.knex('user')
    .where('account', deviceAccount)
    .andWhere('available', true)
    .andWhere('isDevice', true)
    .del();
}
