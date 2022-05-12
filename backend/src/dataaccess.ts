import type { Knex } from 'knex';

import { generateKeyPair, setJsonWebTokenKey } from './verify';
import type * as apiif from './APIInterfaces';

import * as auth from './dataaccess/auth';
import * as workPattern from './dataaccess/workpattern';
import * as record from './dataaccess/record';
import * as user from './dataaccess/user';
import * as apply from './dataaccess/apply';
import * as approval from './dataaccess/approval';
import * as privilege from './dataaccess/privilege';
import * as holiday from './dataaccess/holiday';
import * as config from './dataaccess/config';
import * as mail from './dataaccess/mail';
import * as device from './dataaccess/device';
import * as department from './dataaccess/department';

export interface UserInfo {
  id: number,
  account: string
}

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
        setJsonWebTokenKey(privateKeyConfig.value, publicKeyConfig.value);
        //DatabaseAccess.privateKey = privateKeyConfig.value;
        //DatabaseAccess.publicKey = publicKeyConfig.value;
      }
      else {
        const { privateKey, publicKey } = generateKeyPair();

        await knex('systemConfig').insert([
          { key: 'privateKey', value: privateKey },
          { key: 'publicKey', value: publicKey }
        ])
          .onConflict(['key'])
          .merge(['value']); // ON DUPLICATE KEY UPDATE

        setJsonWebTokenKey(privateKey, publicKey);
        //DatabaseAccess.privateKey = privateKey;
        //DatabaseAccess.publicKey = publicKey;
      }
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 認証関連 dataaccess.auth
  ///////////////////////////////////////////////////////////////////////
  public issueRefreshToken = auth.issueRefreshToken;
  public issueQrCodeRefreshToken = auth.issueQrCodeRefreshToken;
  public issueAccessToken = auth.issueAccessToken;
  public revokeRefreshToken = auth.revokeRefreshToken;
  public revokeQrCodeRefreshToken = auth.revokeQrCodeRefreshToken;
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
  public submitRecord = record.submitRecord;
  public getRecords = record.getRecords;

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連 dataaccess.user
  ///////////////////////////////////////////////////////////////////////
  public getUsersInfo = user.getUsersInfo;
  public getUserInfoById = user.getUserInfoById;
  public getUserInfoByAccount = user.getUserInfoByAccount;
  public generateAvailableUserAccount = user.generateAvailableUserAccount;
  public addUsers = user.addUsers;
  public deleteUser = user.deleteUser;
  public disableUser = user.disableUser;
  public enableUser = user.enableUser;

  ///////////////////////////////////////////////////////////////////////
  // 申請関連 dataaccess.apply
  ///////////////////////////////////////////////////////////////////////
  public submitApply = apply.submitApply;
  protected getApplyOptions = apply.getApplyOptions;
  public getApply = apply.getApply;
  public getApplyTypeOfApply = apply.getApplyTypeOfApply;
  public getApplyCurrentApprovingUsers = apply.getApplyCurrentApprovingUsers;
  public approveApply = apply.approveApply;
  public getApplyTypes = apply.getApplyTypes;
  public addApplyType = apply.addApplyType;
  protected getEmailsOfApply = apply.getEmailsOfApply;
  public sendApplyMail = apply.sendApplyMail;
  public sendApplyRejectedMail = apply.sendApplyRejectedMail;
  public sendApplyApprovedMail = apply.sendApplyApprovedMail;
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
  // システム設定関連
  ///////////////////////////////////////////////////////////////////////
  public setSystemConfig = config.setSystemConfig
  public getSystemConfigValue = config.getSystemConfigValue;
  public getSystemConfig = config.getSystemConfig;

  ///////////////////////////////////////////////////////////////////////
  // メール関連
  ///////////////////////////////////////////////////////////////////////
  public queueMail = mail.queueMail;
  public getMails = mail.getMails;
  public getSmtpServerInfo = mail.getSmtpServerInfo;
  public deleteMail = mail.deleteMail;

  ///////////////////////////////////////////////////////////////////////
  // デバイス情報関連
  ///////////////////////////////////////////////////////////////////////
  public getDevices = device.getDevices;
  public getDeviceRefreshToken = device.getDeviceRefreshToken;
  public addDevice = device.addDevice;
  public updateDevice = device.updateDevice;
  public deleteDevice = device.deleteDevice;

  ///////////////////////////////////////////////////////////////////////
  // 部署情報関連
  ///////////////////////////////////////////////////////////////////////
  protected getSections = department.getSections;
  public async getDepartments() {

    const sections = await this.knex
      .select<{ departmentName: string, sectionName: string }[]>
      ({ departmentName: 'department.name' }, { sectionName: 'section.name' })
      .from('section')
      .join('department', { 'department.id': 'section.department' });

    const result: apiif.DepartmentResponseData[] = [];

    for (const section of sections) {
      const sameDepartment = result.find((elem) => elem.name === section.departmentName);
      if (!sameDepartment?.sections) {
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

}