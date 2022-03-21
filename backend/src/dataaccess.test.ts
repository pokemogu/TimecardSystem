import fs, { accessSync } from 'fs';
import dotenv from 'dotenv';
import { Knex } from 'knex';
import knexConnect from 'knex';
import { hashPassword } from './auth';
import { DatabaseAccess } from "./dataaccess";
import debug from 'debug';
import { doesNotMatch } from 'assert';

const testSuperUserAccount = '____TEST_SUPER_USER_NAME___';
const testSuperUserName = 'スーパーシステム管理者X';
const testSuperUserPhonetic = 'スーパーシステムカンリシャエックス';
let testSuperUserPassword = 'P@ssw0rdXXXXX'
const testSuperPrivilegeName = '____TEST_SUPER_USER_PRIVILEGE___';

describe('データアクセステスト', () => {

  let knexconfig: Knex.Config = {};
  let refreshToken: string = '';

  // 初期化
  beforeAll(async () => {
    dotenv.config({
      path: process.env.NODE_ENV
        ? (fs.existsSync("./.env." + process.env.NODE_ENV) ? ("./.env." + process.env.NODE_ENV) : "./.env")
        : "./.env"
    });

    // データベースアクセス設定
    knexconfig = {
      client: process.env.DB_TYPE || 'sqlite3',
    };

    if (knexconfig.client === 'sqlite3') {
      knexconfig.connection = { filename: process.env.DB_NAME || './my_db.sqlite' };
    }
    else {
      knexconfig.connection = {
        host: process.env.DB_HOST || "localhost",
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        database: process.env.DB_NAME || "my_db",
        user: process.env.DB_APP_USER || "my_user",
        password: process.env.DB_APP_PASSWORD || "P@ssw0rd",
      };
      knexconfig.pool = {
        min: 0,
        max: 1
      };
    }

    // テスト用特権ユーザーの作成
    const knex = knexConnect(knexconfig);
    await knex('privilege').insert({
      name: testSuperPrivilegeName,
      recordByLogin: true, applyRecord: true, applyVacation: true, applyHalfDayVacation: true, applyMakeupVacation: true,
      applyMourningLeave: true, applyMeasureLeave: true, applyOvertime: true, applyLate: true, approve: true, viewDuty: true,
      viewSectionUserInfo: true, viewDepartmentUserInfo: true, viewAllUserInfo: true,
      configureDutySystem: true, configurePrivilege: true, configureDutyStructure: true,
      issueQr: true, registerUser: true, registerDevice: true
    })
    const lastPrivilegeResult = await knex.select<{ [name: string]: number }>(knex.raw('LAST_INSERT_ID()')).first();
    const lastPrivilegeId = lastPrivilegeResult['LAST_INSERT_ID()'];

    await knex('user').insert({
      available: true, account: testSuperUserAccount, password: hashPassword(testSuperUserPassword),
      email: 'adm99999@sample.com', name: testSuperUserName, phonetic: testSuperUserPhonetic,
      privilege: lastPrivilegeId
    });

    // 特権ユーザーのログイン
    const access = new DatabaseAccess(knexconfig);
    const tokenInfo = await access.issueRefreshToken(testSuperUserAccount, testSuperUserPassword);
    refreshToken = tokenInfo.refreshToken;
  });

  describe('一般情報取得テスト', () => {

    // デバイス情報取得
    test('getDevices', async () => {
      const access = new DatabaseAccess(knexconfig);
      const result = await access.getDevices();
      expect(result).toBeDefined();
      console.log(result);
    });

    test('getDepartments', async () => {
      const access = new DatabaseAccess(knexconfig);
      const departments = await access.getDepartments();
      expect(departments).toBeDefined();

      departments.forEach((department) => {
        console.log(department.name + '->');
        console.log(department.sections);
      });
    });

    // 申請オプション情報取得
    test('getApplyOptionTypes', async () => {
      const access = new DatabaseAccess(knexconfig);

      const applyTypes = await access.getApplyTypes();
      expect(applyTypes).toBeDefined();
      console.log(applyTypes);

      applyTypes.forEach(async (applyType) => {
        const appyOptionTypes = await access.getApplyOptionTypes(applyType.name)
        expect(appyOptionTypes).toBeDefined();
        console.log(applyType.name + ' -> ');
        appyOptionTypes.forEach((appyOptionType) => {
          console.log(appyOptionType);
        })
      });
    });
  });

  // アクセストークン取得・検証
  describe('認証関連テスト', () => {
    test('issueAccessToken & getUserInfoFromAccessToken', async () => {
      const access = new DatabaseAccess(knexconfig);
      const token = await access.issueAccessToken(refreshToken);
      expect(token).not.toBe('');
      const userData = await access.getUserInfoFromAccessToken(token);
      expect(userData).toBeDefined();
      expect(userData.account).toBe(testSuperUserAccount);
      console.log(userData);
    });

    test('changeUserPassword', async () => {
      const access = new DatabaseAccess(knexconfig);
      const token = await access.issueAccessToken(refreshToken);
      expect(token).not.toBe('');

      try {
        const newPassword = testSuperUserPassword + 'hogehogehogehoge'
        await access.changeUserPassword(token, null, testSuperUserPassword + 'hogehoge', newPassword);
        expect(true).toBeFalsy();
      }
      catch (error) {
      }

      const newPassword1 = testSuperUserPassword + 'hogehogehogehoge'
      await access.changeUserPassword(token, null, testSuperUserPassword, newPassword1);
      testSuperUserPassword = newPassword1;

      const newPassword2 = testSuperUserPassword + 'hogehogehogehoge'
      await access.changeUserPassword(token, null, testSuperUserPassword, newPassword2);
      testSuperUserPassword = newPassword2;
    });
  });

  describe('ユーザー関連テスト', () => {
    beforeAll(async () => {
      // テスト用の権限登録
      //const knex = knexConnect(knexconfig);
      //await knex('privilege').insert({ name: 'QRコード使用者', recordByLogin: false });
      //const access = new DatabaseAccess(knexconfig);
      /*
            await access.registerPrivilege({
              name: 'QRコード使用者',
              recordByLogin: false,
      
            });
            */
    });

    test('getUser', async () => {
      const access = new DatabaseAccess(knexconfig);
      const userInfo = await access.getUser(testSuperUserAccount);
      console.log(userInfo);
      expect(userInfo).toBeDefined();
    });

    test('getUsersByName', async () => {
      const access = new DatabaseAccess(knexconfig);
      const userInfos = await access.getUsersByName(
        testSuperUserName.slice(Math.floor(testSuperUserName.length / 2))
      );
      console.log(userInfos);
      expect(userInfos).toBeDefined();
      expect(userInfos.length).toBeGreaterThan(0);
      expect(userInfos.some(userInfo => userInfo.account === testSuperUserAccount)).toBeTruthy();
    });

    test('getUsersByPhonetic', async () => {
      const access = new DatabaseAccess(knexconfig);
      const userInfos = await access.getUsersByPhonetic(
        testSuperUserPhonetic.slice(Math.floor(testSuperUserPhonetic.length / 2))
      );
      console.log(userInfos);
      expect(userInfos).toBeDefined();
      expect(userInfos.length).toBeGreaterThan(0);
      expect(userInfos.some(userInfo => userInfo.account === testSuperUserAccount)).toBeTruthy();
    });
    /*
        test('registerUser & deleteUser', async () => {
          const access = new DatabaseAccess(knexconfig);
          const userInfo = await access.registerUser({
            available: true,
            account: 'TST34567',
            name: '如月 菖蒲',
            phonetic: 'キサラギ アヤメ',
            email: 'ayame_kisaragi@sample.com'
          }, 'P@ssw0rd');
          console.log(userInfo);
          expect(userInfo).toBeDefined();
        });
    */
    afterAll(async () => {
      /*
      const access = new DatabaseAccess(knexconfig);
      await access.revokeRefreshToken(testSuperUserName, refreshToken);

      const knex = knexConnect(knexconfig);
      await knex('user').where('account', testSuperUserName).del();
      await knex('privilege').where('name', testSuperPrivilegeName).del();
      knex.destroy();
      */
    });
  });

  describe('その他テスト', () => {
    test('getSmtpServerInfo', async () => {
      const access = new DatabaseAccess(knexconfig);
      const smtpInfo = await access.getSmtpServerInfo();
      console.log(smtpInfo);
    });
  });

  // 後始末
  afterAll(async () => {
    const access = new DatabaseAccess(knexconfig);
    await access.revokeRefreshToken(testSuperUserAccount, refreshToken);

    const knex = knexConnect(knexconfig);
    await knex('user').where('account', testSuperUserAccount).del();
    await knex('privilege').where('name', testSuperPrivilegeName).del();
    knex.destroy();
  });

});
