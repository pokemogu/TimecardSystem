import lodash from 'lodash';
import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';

///////////////////////////////////////////////////////////////////////
// 申請関連
///////////////////////////////////////////////////////////////////////
export async function submitApply(this: DatabaseAccess, accessToken: string, applyType: string, apply: apiif.ApplyRequestBody) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
  if (!authUserInfo) {
    const error = new Error('invalid access token');
    error.name = 'AuthenticationError';
    throw error;
  }

  const applyTypeInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('applyType').where('name', applyType).first();
  let userId = authUserInfo.id;
  if (apply.targetUserAccount) {
    const targetUserInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', apply.targetUserAccount).first();
    if (targetUserInfo) {
      userId = targetUserInfo.id;
    }
  }

  const routeInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('approvalRoute').where('name', apply.route).first();
  if (!routeInfo) {
    throw new Error(`invalid route name ${apply.route} specified`);
  }

  await this.knex('apply').insert({
    type: applyTypeInfo.id,
    user: userId,
    appliedUser: authUserInfo.id,
    timestamp: new Date(apply.timestamp),
    date: apply.date,
    dateTimeFrom: new Date(apply.dateTimeFrom),
    dateTimeTo: apply.dateTimeTo ? new Date(apply.dateTimeTo) : undefined,
    dateRelated: apply.dateRelated ? new Date(apply.dateRelated) : undefined,
    reason: apply.reason ? apply.reason : undefined,
    contact: apply.contact ? apply.contact : undefined,
    route: routeInfo.id
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
