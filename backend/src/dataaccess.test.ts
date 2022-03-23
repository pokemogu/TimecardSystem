import fs, { accessSync } from 'fs';
import dotenv from 'dotenv';
import { Knex } from 'knex';
import knexConnect from 'knex';
import { hashPassword } from './auth';
import { DatabaseAccess } from "./dataaccess";

const testSuperUserAccount = '____TEST_SUPER_USER_NAME___';
const testSuperUserName = 'スーパーシステム管理者X';
const testSuperUserPhonetic = 'スーパーシステムカンリシャエックス';
let testSuperUserPassword = 'P@ssw0rdXXXXX'
const testSuperPrivilegeName = '____TEST_SUPER_USER_PRIVILEGE___';

describe('データアクセステスト', () => {

  let knexconfig: Knex.Config = {};
  let knex: Knex;
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
    knex = knexConnect(knexconfig);
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
    const access = new DatabaseAccess(knex);
    const tokenInfo = await access.issueRefreshToken(testSuperUserAccount, testSuperUserPassword);
    refreshToken = tokenInfo.refreshToken;
  });

  describe('一般情報取得テスト', () => {

    // デバイス情報取得
    test('getDevices', async () => {
      const access = new DatabaseAccess(knex);
      const result = await access.getDevices();
      expect(result).toBeDefined();
      console.log(result);
    });

    test('getDepartments', async () => {
      const access = new DatabaseAccess(knex);
      const departments = await access.getDepartments();
      expect(departments).toBeDefined();

      departments.forEach((department) => {
        console.log(department.name + '->');
        console.log(department.sections);
      });
    });

    // 申請オプション情報取得
    test('getApplyOptionTypes', async () => {
      const access = new DatabaseAccess(knex);

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
      const access = new DatabaseAccess(knex);
      const token = await access.issueAccessToken(refreshToken);
      expect(token).not.toBe('');
      const userData = await access.getUserInfoFromAccessToken(token);
      expect(userData).toBeDefined();
      expect(userData.account).toBe(testSuperUserAccount);
      console.log(userData);
    });

    test('changeUserPassword', async () => {
      const access = new DatabaseAccess(knex);
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
      const access = new DatabaseAccess(knex);
      const token = await access.issueAccessToken(refreshToken);

      let userInfo = await access.getUsers(token, {
        byName: '金子'
      });
      console.log(userInfo);
      expect(userInfo).toBeDefined();

      userInfo = await access.getUsers(token, {
        byPhonetic: 'ホシ'
      });
      console.log(userInfo);
      expect(userInfo).toBeDefined();

      userInfo = await access.getUsers(token, {
        byAccount: 'USR00234'
      });
      console.log(userInfo);
      expect(userInfo).toBeDefined();

      userInfo = await access.getUsers(token, {
        byDepartment: '浜松工場',
        bySection: '製造部'
      });
      //console.log(userInfo);
      expect(userInfo).toBeDefined();

      userInfo = await access.getUsers(token, {
        byDepartment: '東名工場',
        bySection: '製造部',
        limit: 25
      });
      //console.log(userInfo);
      expect(userInfo).toBeDefined();
      expect(userInfo.length).toBeLessThanOrEqual(25);

      userInfo = await access.getUsers(token, {
        byName: '久保田',
        byDepartment: '東名工場'
      });
      console.log(userInfo);
      expect(userInfo).toBeDefined();

    });

    test('issueQrCodeRefreshToken && getUsersWithQrCodeIssued', async () => {
      const account = 'USR00001';
      const access = new DatabaseAccess(knex);
      const token = await access.issueAccessToken(refreshToken);

      let userInfo = await access.getUsers(token, { byAccount: account });
      console.log(userInfo);
      expect(userInfo.every(info => info.qrCodeIssuedNum === 0)).toBeTruthy();

      const qrCodeRefreshToken = await access.issueQrCodeRefreshToken(token, account);
      userInfo = await access.getUsers(token, { byAccount: account });
      console.log(userInfo);
      expect(userInfo.every(info => info.qrCodeIssuedNum === 0)).toBeFalsy();
      console.log(qrCodeRefreshToken);

      await access.revokeRefreshToken(account, qrCodeRefreshToken.refreshToken);
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

  describe('メールキュー関連テスト', () => {
    test('queueMail && getMails && deleteMail', async () => {
      const access = new DatabaseAccess(knex);

      await access.queueMail({
        to: 'sample11@sample.com',
        from: 'sample22@sample.com',
        subject: '承認依頼',
        body: 'このメールを読んだらすぐに承認すること。\nわかったな。'
      });

      await access.queueMail({
        to: 'sample14@sample.com',
        from: 'sample92@sample.com',
        subject: '打刻未済',
        body: 'このメールを読んだらすぐに打刻すること。\nわかったな。'
      });

      const mails = await access.getMails();
      expect(mails).toBeDefined();
      expect(mails.length).toBeGreaterThanOrEqual(2);

      for (const mail of mails) {
        await access.deleteMail(mail.id);
      }

      const mailsAfter = await access.getMails();
      expect(mailsAfter).toBeDefined();
      expect(mailsAfter.length).toBe(0);
    });
  });

  describe('打刻情報取得テスト', () => {
    test('getRecords', async () => {
      const access = new DatabaseAccess(knex);

      let result = await access.getRecords({});

      result = await access.getRecords({
        byUserAccount: 'USR00'
      });
      console.log(result);

      result = await access.getRecords({
        from: new Date('2022-03-12')
      });
      console.log(result);

      result = await access.getRecords({
        to: new Date('2022-03-21')
      });
      console.log(result);

      result = await access.getRecords({
        from: new Date('2022-03-01'),
        to: new Date('2022-03-21')
      });
      console.log(result);

      result = await access.getRecords({
        byUserAccount: 'USR00',
        from: new Date('2022-03-01'),
        to: new Date('2022-03-21')
      });
      console.log(result);

      result = await access.getRecords({
        byUserAccount: 'USR00',
        from: new Date('2022-03-01'),
        to: new Date('2022-03-21'),
      });
      console.log(result);

      result = await access.getRecords({
        byUserName: '太郎',
        from: new Date('2022-03-01'),
        to: new Date('2022-03-21'),
      });
      console.log(result);

      result = await access.getRecords({
        byDepartment: '浜松',
        sortBy: 'byDepartment',
        from: new Date('2022-03-01'),
        to: new Date('2022-03-21'),
        limit: 10
      });
      console.log(result);

      result = await access.getRecords({
        byDepartment: '浜松',
        bySection: '製造',
        sortBy: 'byDepartment',
        from: new Date('2022-03-01'),
        to: new Date('2022-03-21'),
        limit: 10
      });
      console.log(result);

    });
  });

  describe('その他テスト', () => {
    test('getSmtpServerInfo', async () => {
      const access = new DatabaseAccess(knex);
      const smtpInfo = await access.getSmtpServerInfo();
      console.log(smtpInfo);
    });
  });

  // 後始末
  afterAll(async () => {
    const access = new DatabaseAccess(knex);
    await access.revokeRefreshToken(testSuperUserAccount, refreshToken);

    await knex('user').where('account', testSuperUserAccount).del();
    await knex('privilege').where('name', testSuperPrivilegeName).del();

    knex.destroy();
  });

});
