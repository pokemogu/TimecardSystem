import { generateKeyPairSync } from 'crypto';

import type { Knex } from 'knex';

import type * as models from 'shared/models';
import type * as apiif from 'shared/APIInterfaces';

import * as auth from './dataaccess.auth';
import * as workPattern from './dataaccess.workpattern';
import * as record from './dataaccess.record';
import * as user from './dataaccess.user';
import * as apply from './dataaccess.apply';
import * as approval from './dataaccess.approval';
import * as privilege from './dataaccess.privilege';
import * as holiday from './dataaccess.holiday';
import * as mail from './dataaccess.mail';

export class DatabaseAccess {
  protected knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  ///////////////////////////////////////////////////////////////////////
  // 基本不変なデータベース内データ(マスターデータ等)のキャッシュ保持
  ///////////////////////////////////////////////////////////////////////

  public static recordTypeCache: { [name: string]: { id: number, description: string } } = {};

  public static async initCache(knex: Knex) {
    const recordTypes = await knex.select<{
      id: number, name: string, description: string
    }[]>({ id: 'id', name: 'name', description: 'description' })
      .from('recordType');

    for (const recordType of recordTypes) {
      DatabaseAccess.recordTypeCache[recordType.name] = { id: recordType.id, description: recordType.description };
    }
  }

  public static publicKey: string = '';
  public static privateKey: string = '';

  public static async initPrivatePublicKeys(knex: Knex) {
    if (await knex.schema.hasTable('systemConfig')) {
      const configValues = await knex
        .select<{ key: string, value: string }[]>
        ({ key: 'key' }, { value: 'value' })
        .from('systemConfig').where('key', 'privateKey').orWhere('key', 'publicKey');

      const privateKeyConfig = configValues.find(config => config.key === 'privateKey');
      const publicKeyConfig = configValues.find(config => config.key === 'publicKey');
      if (privateKeyConfig && publicKeyConfig && privateKeyConfig.value !== '' && publicKeyConfig.value !== '') {
        DatabaseAccess.privateKey = privateKeyConfig.value;
        DatabaseAccess.publicKey = publicKeyConfig.value;
      }
      else {
        const { privateKey, publicKey } = generateKeyPairSync('ec', {
          namedCurve: 'P-256',
          publicKeyEncoding: { type: 'spki', format: 'pem' },
          privateKeyEncoding: { type: 'pkcs8', format: 'pem', }
        });

        await knex('systemConfig').insert([
          { key: 'privateKey', value: privateKey },
          { key: 'publicKey', value: publicKey }
        ])
          .onConflict(['key'])
          .merge('value'); // ON DUPLICATE KEY UPDATE

        DatabaseAccess.privateKey = privateKey;
        DatabaseAccess.publicKey = publicKey;
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 認証関連 dataaccess.auth
  ///////////////////////////////////////////////////////////////////////
  public issueRefreshToken = auth.issueRefreshToken;
  public issueQrCodeRefreshToken = auth.issueQrCodeRefreshToken;
  public issueAccessToken = auth.issueAccessToken;
  public getUserInfoFromAccessToken = auth.getUserInfoFromAccessToken;
  public revokeRefreshToken = auth.revokeRefreshToken;
  public deleteAllExpiredRefreshTokens = auth.deleteAllExpiredRefreshTokens;
  public changeUserPassword = auth.changeUserPassword;

  ///////////////////////////////////////////////////////////////////////
  // 勤務体系 dataaccess.workPattern
  ///////////////////////////////////////////////////////////////////////
  public addWorkPattern = workPattern.addWorkPattern;
  public getWorkPatterns = workPattern.getWorkPatterns;
  public getWorkPattern = workPattern.getWorkPattern;
  public updateWorkPattern = workPattern.updateWorkPattern;
  public deleteWorkPattern = workPattern.deleteWorkPattern;
  public setUserWorkPatternCalendar = workPattern.setUserWorkPatternCalendar;
  public getUserWorkPatternCalendar = workPattern.getUserWorkPatternCalendar;
  public deleteUserWorkPatternCalendar = workPattern.deleteUserWorkPatternCalendar;

  ///////////////////////////////////////////////////////////////////////
  // 打刻情報関連 dataaccess.record
  ///////////////////////////////////////////////////////////////////////
  public putRecord = record.putRecord;
  public getRecords = record.getRecords;

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連 dataaccess.user
  ///////////////////////////////////////////////////////////////////////
  public getUsers = user.getUsers;
  public generateAvailableUserAccount = user.generateAvailableUserAccount;
  public registerUser = user.registerUser;
  public deleteUser = user.deleteUser;
  public disableUser = user.disableUser;

  ///////////////////////////////////////////////////////////////////////
  // 申請関連 dataaccess.apply
  ///////////////////////////////////////////////////////////////////////
  public submitApply = apply.submitApply;
  public getApplyTypes = apply.getApplyTypes;
  public addApplyType = apply.addApplyType;
  public updateApplyType = apply.updateApplyType;
  public deleteApplyType = apply.deleteApplyType;
  public getApplyOptionTypes = apply.getApplyOptionTypes;

  ///////////////////////////////////////////////////////////////////////
  // 承認関連 dataaccess.approval
  ///////////////////////////////////////////////////////////////////////
  public getApprovalRouteRoles = approval.getApprovalRouteRoles;
  public addApprovalRoute = approval.addApprovalRoute;
  public getApprovalRoutes = approval.getApprovalRoutes;
  public updateApprovalRoute = approval.updateApprovalRoute;
  public deleteApprovalRoute = approval.deleteApprovalRoute;

  ///////////////////////////////////////////////////////////////////////
  // 権限情報関連
  ///////////////////////////////////////////////////////////////////////
  //public registerPrivilege = privilege.registerPrivilege;
  public getUserPrivilege = privilege.getUserPrivilege;
  //public getUserApplyPrivilege = privilege.getUserApplyPrivilege;
  public addPrivilege = privilege.addPrivilege;
  public getPrivileges = privilege.getPrivileges;
  public getApplyPrivilege = privilege.getApplyPrivilege;
  public updatePrivilege = privilege.updatePrivilege;
  public deletePrivilege = privilege.deletePrivilege;

  ///////////////////////////////////////////////////////////////////////
  // 休日関連
  ///////////////////////////////////////////////////////////////////////
  public setHoliday = holiday.setHoliday;
  public getHolidays = holiday.getHolidays;
  public deleteHoliday = holiday.deleteHoliday;

  ///////////////////////////////////////////////////////////////////////
  // メール関連
  ///////////////////////////////////////////////////////////////////////
  public queueMail = mail.queueMail;
  public getMails = mail.getMails;
  public getSmtpServerInfo = mail.getSmtpServerInfo;
  public deleteMail = mail.deleteMail;

  ///////////////////////////////////////////////////////////////////////
  // 部署情報関連
  ///////////////////////////////////////////////////////////////////////
  public async getDepartments() {

    const sections = await this.knex
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
    const devices = await this.knex.table<models.Device>('device');

    return devices.map((device) => { return <apiif.DevicesResponseData>{ name: device.name } });
  }

}