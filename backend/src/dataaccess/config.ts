import { DatabaseAccess } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

export async function setSystemConfig(this: DatabaseAccess, key: string, value: string) {

  await this.knex('systemConfig').where('key', key).update({ value: value });
}

export async function getSystemConfigValue(this: DatabaseAccess, key: string) {

  const result = await this.knex.select<{ value: string }[]>({ value: 'value' })
    .from('systemConfig')
    .where('key', key)
    .first();

  return result.value as string;
}

export async function getSystemConfig(this: DatabaseAccess, params: apiif.SystemConfigQuery) {

  return await this.knex.select<apiif.SystemConfigResponseData[]>({
    key: 'key', value: 'value', title: 'title', description: 'description', isMultiLine: 'isMultiLine', isPassword: 'isPassword'
  })
    .from('systemConfig')
    .where(function (builder) {
      if (params.key) {
        builder.where('key', 'like', `%${params.key}%`);
      }
    })
    .modify(function (builder) {
      if (params.limit) {
        builder.limit(params.limit);
      }
      if (params.offset) {
        builder.offset(params.offset);
      }
    }) as apiif.SystemConfigResponseData[];
}
