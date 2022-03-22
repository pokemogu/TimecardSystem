import lodash from 'lodash';
import knexConnect, { knex } from 'knex';
import type { Knex } from 'knex';
import { hashPassword, verifyPassword, issueRefreshToken, verifyRefreshToken, issueAccessToken, verifyAccessToken } from './auth';

import type * as models from 'shared/models';
import type * as apiif from 'shared/APIInterfaces';

export class DatabaseAccess {
  private knexconfig: Knex.Config;

  constructor(knexconfig: Knex.Config) {
    this.knexconfig = knexconfig;
    //knexConnect(this.knexconfig);
  }


  ///////////////////////////////////////////////////////////////////////
  // 認証関連
  ///////////////////////////////////////////////////////////////////////
  public async issueRefreshToken(account: string, password: string, isQrToken: boolean = false): Promise<apiif.IssueTokenResponseData> {
    const knex = knexConnect(this.knexconfig);

    // 部門や部署に所属していない可能性があるのでLEFT JOINとする。
    const user = await knex.select<{
      id: number, available: boolean, account: string, password: string, name: string, department: string, section: string
    }>({ id: 'user.id', available: 'user.available', account: 'user.account', password: 'user.password', name: 'user.name', department: 'department.name', section: 'section.name' })
      .from('user')
      .leftJoin('section', { 'user.section': 'section.id' })
      .leftJoin('department', { 'section.department': 'department.id' })
      .where('user.account', account)
      .first();

    if (!user.available) {
      throw new Error('user is not available.');
    }

    if (!verifyPassword(user.password, password)) {
      throw new Error('password verification failed.');
    }

    // 通常のトークン期限は1日、QRコード用の場合だけ10年とする
    const secondsPerDay = 60 * 60 * 24;
    const token = issueRefreshToken({ account: account }, secondsPerDay * (isQrToken ? 3650 : 1));
    await knex('token').insert({
      user: user.id,
      refreshToken: token,
      isQrToken: isQrToken
    });

    return { refreshToken: token, name: user.name, department: user.department, section: user.section };
  }

  public async issueAccessToken(token: string) {
    const knex = knexConnect(this.knexconfig);
    const tokenData = await knex.select<{ account: string, tokenId: number, refreshToken: string }>(
      { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
    )
      .from('user')
      .join('token', { 'user.id': 'token.user' })
      .where('token.refreshToken', token)
      .first();

    if (!tokenData) {
      throw new Error('refresh token does not exist');
    }

    if (!verifyRefreshToken(token, { account: tokenData.account })) {
      throw new Error('refresh token verification failed.');
    }

    const accessToken = issueAccessToken({ account: tokenData.account }, 60);
    await knex('token').update({
      accessToken: accessToken
    })
      .where('id', tokenData.tokenId)

    return accessToken;
  }

  public async getUserInfoFromAccessToken(token: string): Promise<{
    id: number,
    account: string,
    section: number,
    email: string,
    phonetic: string,
    privilege: number
  }> {
    const knex = knexConnect(this.knexconfig);
    const userData = await knex.select<{ id: number, account: string, section: number, email: string, phonetic: string, privilege: number }>(
      { id: 'user.id', account: 'user.account', section: 'user.section', email: 'user.email', phonetic: 'user.phonetic', privilege: 'user.privilege' }
    )
      .from('user')
      .join('token', { 'user.id': 'token.user' })
      .where('token.accessToken', token)
      .first();

    if (!userData) {
      throw new Error('access token does not exist');
    }

    if (!verifyAccessToken(token, { account: userData.account })) {
      throw new Error('refresh token verification failed.');
    }

    return userData;
  }

  public async revokeRefreshToken(account: string, token: string) {
    if (!verifyRefreshToken(token, { account: account })) {
      throw new Error('refresh token verification failed.');
    }

    const knex = knexConnect(this.knexconfig);
    const user = await knex.select<{ id: number }>({ id: 'user.id' })
      .from('user')
      .where('user.account', account)
      .first();

    await knex('token').where('user', user.id).del();
  }

  public async deleteAllExpiredRefreshTokens() {
    const knex = knexConnect(this.knexconfig);
    const tokenData = await knex.select<{ account: string, tokenId: number, refreshToken: string }[]>(
      { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
    )
      .from('token')
      .join('user', { 'user.id': 'token.user' })

    for (const token of tokenData) {
      try {
        verifyRefreshToken(token.refreshToken, { account: token.account });
      } catch (error: unknown) {
        if ((error as Error).name === 'TokenExpiredError') {
          await knex('token').del().where('id', token.tokenId);
        }
        else {
          throw error;
        }
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 部署情報関連
  ///////////////////////////////////////////////////////////////////////
  public async getDepartments() {
    const knex = knexConnect(this.knexconfig);

    const sections = await knex
      .select<{ departmentName: string, sectionName: string }[]>
      ({ departmentName: 'department.name' }, { sectionName: 'section.name' })
      .from('section')
      .join('department', { 'department.id': 'section.department' });

    const result: apiif.DepartmentResponseData[] = [];

    for (const section of sections) {
      const sameDepartment = result.find((elem) => elem.name === section.departmentName);
      if (!sameDepartment) {
        result.push({
          name: section.departmentName,
          sections: [{ name: section.sectionName }]
        });
      }
      else {
        sameDepartment.sections.push({
          name: section.sectionName
        });
      }
    }

    return result;
  }

  ///////////////////////////////////////////////////////////////////////
  // デバイス情報関連
  ///////////////////////////////////////////////////////////////////////
  public async getDevices() {
    const knex = knexConnect(this.knexconfig);
    const devices = await knex.table<models.Device>('device');

    return devices.map((device) => { return <apiif.DevicesResponseData>{ name: device.name } });
  }

  ///////////////////////////////////////////////////////////////////////
  // 申請タイプ情報関連
  ///////////////////////////////////////////////////////////////////////
  public async getApplyTypes() {
    const knex = knexConnect(this.knexconfig);

    const applyTypes = await knex
      .select<{ name: string, description: string }[]>
      ({ name: 'name' }, { description: 'description' })
      .from('applyType');

    return applyTypes;
  }

  public async getApplyOptionTypes(applyType: string) {
    const knex = knexConnect(this.knexconfig);

    const optionTypes = await knex
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

  ///////////////////////////////////////////////////////////////////////
  // 権限情報関連
  ///////////////////////////////////////////////////////////////////////
  public async registerPrivilege(privilegeData: {

  }) {
    const privilege = lodash.omit(privilegeData, ['id']);

    const knex = knexConnect(this.knexconfig);
    await knex('privilege').insert(privilege);
  }

  public async deletePrivilege(idOrName: string | number) {
    const knex = knexConnect(this.knexconfig);

    if (typeof idOrName === 'string') {
      return await knex('privilege').del().where('name', idOrName);
    }
    else {
      return await knex('privilege').del().where('id', idOrName);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連
  ///////////////////////////////////////////////////////////////////////
  public async getUser(idOrAccount: string | number) {
    const knex = knexConnect(this.knexconfig);

    if (typeof idOrAccount === 'string') {
      return await knex.table<models.User>('user').first().where('account', idOrAccount);
    }
    else {
      return await knex.table<models.User>('user').first().where('id', idOrAccount);
    }
  }

  public async getUsersByName(name: string) {
    const knex = knexConnect(this.knexconfig);

    return await knex.table<models.User>('user').where('name', 'like', `%${name}%`);
  }

  public async getUsersByPhonetic(phonetic: string) {
    const knex = knexConnect(this.knexconfig);

    return await knex.table<models.User>('user').where('phonetic', 'like', `%${phonetic}%`);
  }

  public async registerUser(userData: models.User, password: string, params?: {
    department?: string, section?: string, privilege?: string
  }) {
    const user = lodash.omit(userData, ['id']);
    user.password = hashPassword(password);

    if (params) {

    } else {

    }

    const knex = knexConnect(this.knexconfig);
    await knex('user').insert(user);
  }

  public async deleteUser(idOrAccount: number | string) {
    const knex = knexConnect(this.knexconfig);

    if (typeof idOrAccount === 'string') {
      return await knex('user').del().where('account', idOrAccount);
    }
    else {
      return await knex('user').del().where('id', idOrAccount);
    }
  }

  public async changeUserPassword(token: string, account: string | null, oldPassword: string, newPassword: string) {
    const authUserInfo = await this.getUserInfoFromAccessToken(token);
    const knex = knexConnect(this.knexconfig);

    if (!account) {
      const userInfo = await knex.table<models.User>('user').first().where('id', authUserInfo.id);
      if (!verifyPassword(userInfo.password, oldPassword)) {
        throw new Error('invalid password');
      }
      await knex('user').update({
        password: hashPassword(newPassword)
      })
        .where('id', userInfo.id);
    } else {
      const userInfo = await knex.table<models.User>('user').first().where('account', account);
      if (!verifyPassword(userInfo.password, oldPassword)) {
        throw new Error('invalid password');
      }
      await knex('user').update({
        password: hashPassword(newPassword)
      })
        .where('id', userInfo.id);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // メールキュー
  ///////////////////////////////////////////////////////////////////////

  public async queueMail(params: {
    from: string, to: string, cc?: string, subject: string, body: string
  }) {
    const knex = knexConnect(this.knexconfig);

    await knex('mailQueue').insert([
      {
        from: params.from,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        body: params.body,
        timestamp: new Date()
      }
    ]);
  }

  public async getMails() {
    const knex = knexConnect(this.knexconfig);

    return await knex
      .select<{ id: number, from: string, to: string, cc: string, subject: string, body: string, timestamp: Date }[]>
      (
        { id: 'id' }, { from: 'from' }, { to: 'to' }, { cc: 'cc' }, { subject: 'subject' }, { body: 'body' }, { timestamp: 'timestamp' }
      )
      .from('mailQueue');
  }

  public async deleteMail(id: number) {
    const knex = knexConnect(this.knexconfig);

    await knex('mailQueue').where('id', id).del();
  }

  ///////////////////////////////////////////////////////////////////////
  // その他内部情報の取得など
  ///////////////////////////////////////////////////////////////////////

  public async getSmtpServerInfo() {
    const knex = knexConnect(this.knexconfig);

    if (await knex.schema.hasTable('config')) {
      const configValues = await knex
        .select<{ key: string, value: string }[]>
        ({ key: 'key' }, { value: 'value' })
        .from('config')
        .where('key', 'like', 'smtp%');

      if (!configValues) {
        return undefined;
      }

      let smtpHost = '';
      let smtpPort = 0;
      let smtpUsername = '';
      let smtpPassword = '';

      configValues.forEach((configValue) => {
        if (configValue.key === 'smtpHost') {
          smtpHost = configValue.value;
        }
        else if (configValue.key === 'smtpPort') {
          smtpPort = parseInt(configValue.value);
        }
        else if (configValue.key === 'smtpUsername') {
          smtpUsername = configValue.value;
        }
        else if (configValue.key === 'smtpPassword') {
          smtpPassword = configValue.value;
        }
      });

      if (smtpHost !== '' && smtpPort !== 0 && smtpUsername !== '' && smtpPassword !== '') {
        return {
          host: smtpHost,
          port: smtpPort,
          username: smtpUsername,
          password: smtpPassword
        };
      }
      else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
}