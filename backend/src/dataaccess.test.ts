import mysql2 from 'mysql2/promise';
import { Knex } from 'knex';
import knexConnect from 'knex';
import { generateKeyPair, setJsonWebTokenKey } from './verify';
import { DatabaseAccess } from "./dataaccess";

const testSuperUserAccount = '____TEST_SUPER_USER_NAME___';
const testSuperUserName = 'スーパーシステム管理者X';
const testSuperUserDefaultWorkPattern = 'スーパーシステム管理者の勤務体系';
const testSuperUserPhonetic = 'スーパーシステムカンリシャエックス';
let testSuperUserPassword = 'P@ssw0rdXXXXX'
let testSuperUserId = 0;
const testSuperPrivilegeName = '____TEST_SUPER_USER_PRIVILEGE___';
const testSuperWorkPatternName = '____TEST_SUPER_USER_WORKPATTERN___';

describe('データアクセス', () => {

  const generateRandomString = () => { return Math.random().toString(32).substring(2) };

  let knexconfig: Knex.Config = {};
  let knex: Knex;
  let refreshToken: string = '';

  const dbName = 'timecard_' + generateRandomString();
  const dbUser = generateRandomString();
  const dbPass = generateRandomString();

  // 初期化
  beforeAll(async () => {
    // テスト用データベースの作成
    const conn = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_ROOT_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || 'password'
    });
    await conn.execute(`CREATE DATABASE ${dbName}`);
    await conn.execute(`CREATE USER '${dbUser}'@'%' IDENTIFIED BY '${dbPass}'`);
    await conn.execute(`GRANT ALL PRIVILEGES ON ${dbName}.* TO '${dbUser}'@'%'`)
    await conn.execute(`FLUSH PRIVILEGES`);

    // データベースアクセス設定
    knexconfig = {
      client: process.env.DB_TYPE || 'sqlite3',
    };

    if (knexconfig.client === 'sqlite3') {
      knexconfig.connection = { filename: process.env.DB_NAME || ':memory:', };
      knexconfig.useNullAsDefault = true;
    }
    else {
      knexconfig.connection = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
        database: dbName,
        user: dbUser,
        password: dbPass,
      };
      knexconfig.pool = {
        min: 0,
        max: 1
      };
    }

    const { privateKey, publicKey } = generateKeyPair();
    setJsonWebTokenKey(privateKey, publicKey);

    // DDL適用
    knex = knexConnect(knexconfig);
    await knex.migrate.latest(); // 全DDL適用なので非常に時間かかる

    console.log('全体-beforeAll ' + new Date().toISOString());
  });

  // 後始末
  afterAll(async () => {
    // テスト用データベースの削除
    const conn = await mysql2.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
      user: process.env.DB_ROOT_USER || 'root',
      password: process.env.DB_ROOT_PASSWORD || 'password'
    });
    await conn.execute(`DROP USER '${dbUser}'@'%'`);
    await conn.execute(`DROP DATABASE ${dbName}`);
  });

  test('事前の基本テスト(権限、勤務体系、ユーザー)', async () => {
    const testUserAccount = generateRandomString();
    const testUserPassword = generateRandomString();
    const testEmail = generateRandomString() + '@' + generateRandomString() + '.com';
    const testWorkPatternName = generateRandomString();
    const testPrivilegeName = generateRandomString();

    const access = new DatabaseAccess(knex);

    // 権限を新規追加する
    await expect(access.addPrivilege({
      name: testPrivilegeName,
      recordByLogin: true, approve: true,
      viewRecord: true, viewRecordPerDevice: true,
      viewSectionUserInfo: true, viewDepartmentUserInfo: true, viewAllUserInfo: true,
      configurePrivilege: true, configureWorkPattern: true,
      issueQr: true, registerUser: true, registerDevice: true
    })).resolves.not.toThrow();

    // 権限が追加されていることを確認する
    const privileges = await access.getPrivileges();
    expect(privileges?.length).toBeDefined();
    expect(privileges.length).toBeGreaterThan(0);
    expect(privileges.some(privilege => privilege.name === testPrivilegeName)).toBeTruthy();

    // 勤務体系を新規追加する
    await expect(access.addWorkPattern({
      name: testWorkPatternName,
      onTimeStart: '08:30',
      onTimeEnd: '17:30'
    })).resolves.not.toThrow();

    // 勤務体系が追加されていることを確認する
    const workPatterns = await access.getWorkPatterns();
    expect(workPatterns?.length).toBeDefined();
    expect(workPatterns.length).toBeGreaterThan(0);
    expect(workPatterns.some(workPattern => workPattern.name === testWorkPatternName)).toBeTruthy();

    // ユーザーを新規追加する
    await expect(access.addUsers([{
      account: testUserAccount, password: testUserPassword,
      email: testEmail, name: '山田 太郎', phonetic: 'ヤマダ タロウ',
      privilegeName: testPrivilegeName, defaultWorkPatternName: testWorkPatternName
    }])).resolves.not.toThrow();

    // ユーザーが追加されていることを確認する
    const users = await access.getUsers();
    expect(users?.length).toBeDefined();
    expect(users.length).toBeGreaterThan(0);
    expect(users.some(user => user.account === testUserAccount)).toBeTruthy();

    // ユーザーを削除する
    await expect(access.deleteUser(testUserAccount)).resolves.not.toThrow();

    // 勤務体系を削除する
    const workPatternId = workPatterns.find(workPattern => workPattern.name === testWorkPatternName).id;
    //await expect(access.deleteWorkPattern(workPatternId)).resolves.not.toThrow();

    // 権限を削除する
    const privilegeId = privileges.find(privilege => privilege.name === testPrivilegeName).id;
    await expect(access.deletePrivilege(privilegeId)).resolves.not.toThrow();
  });

  describe('一般情報取得テスト', () => {

    // デバイス情報取得
    /*
    test('getDevices', async () => {
      const access = new DatabaseAccess(knex);
      const result = await access.getDevices();
      expect(result).toBeDefined();
      console.log(result);
    });
    */

    test('getDepartments', async () => {
      const access = new DatabaseAccess(knex);
      const departments = await access.getDepartments();
      console.log(departments);
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

    test('getApprovalRoutes', async () => {
      const access = new DatabaseAccess(knex);
      const roleMembers = await access.getApprovalRoutes();
      console.dir(roleMembers, { depth: null });
      expect(roleMembers).toBeDefined();

      for (const roleMember of roleMembers) {
        //  const roleMembersforSeizoSHain = await access.getApprovalRoutes(token, undefined, roleMember.id);
        // expect(roleMembersforSeizoSHain).toBeDefined();
      }
    });

    test('getUserWorkPatternCalendar', async () => {
      const access = new DatabaseAccess(knex);
      const result = await access.getUserWorkPatternCalendar(
        {
          id: 0,
          account: 'USR00225'
        },
        {
          accounts: ['USR00225'],
          from: '2022-04-09',
          to: '2022-04-09'
        }
      );
      console.dir(result, { depth: null });
    });
  });

  // アクセストークン取得・検証
  describe('認証関連テスト', () => {
    const testUserAccount = generateRandomString();
    const testUserPassword = generateRandomString();
    const testEmail = generateRandomString() + '@' + generateRandomString() + '.com';
    const testWorkPatternName = generateRandomString();
    const testPrivilegeName = generateRandomString();

    beforeAll(async () => {
      const access = new DatabaseAccess(knex);

      await expect(access.addPrivilege({ name: testPrivilegeName })).resolves.not.toThrow();
      await expect(access.addWorkPattern({ name: testWorkPatternName, onTimeStart: '08:30', onTimeEnd: '17:30' })).resolves.not.toThrow();
      await expect(access.addUsers([{
        account: testUserAccount, password: testUserPassword,
        email: testEmail, name: '山田 太郎', phonetic: 'ヤマダ タロウ',
        privilegeName: testPrivilegeName, defaultWorkPatternName: testWorkPatternName
      }])).resolves.not.toThrow();
    });

    afterAll(async () => {
      const access = new DatabaseAccess(knex);

      await expect(access.deleteUser(testUserAccount)).resolves.not.toThrow();
      const privileges = await access.getPrivileges();
      const privilegeId = privileges.find(privilege => privilege.name === testPrivilegeName).id;
      await expect(access.deletePrivilege(privilegeId)).resolves.not.toThrow();
    });

    test('issueRefreshToken, issueAccessToken, revokeRefreshToken', async () => {
      const access = new DatabaseAccess(knex);

      // issueRefreshToken
      const tokenResponse = await access.issueRefreshToken(testUserAccount, testUserPassword);
      expect(tokenResponse.refreshToken).not.toBe('');

      // issueAccessToken
      const token = await access.issueAccessToken(tokenResponse.refreshToken);
      expect(token).not.toBe('');

      await expect(access.revokeRefreshToken(testUserAccount, tokenResponse.refreshToken)).resolves.not.toThrow();
    });

    test('changeUserPassword', async () => {
      const access = new DatabaseAccess(knex);
      const users = await access.getUsers({ byAccounts: [testUserAccount] });
      expect(users.length).toBeGreaterThan(0);
      expect(users.some(user => user.account === testUserAccount)).toBeTruthy();
      const userInfo = users[0];

      // 現在のパスワードが間違っている場合
      const newPassword = testUserPassword + 'hogehogehogehoge'
      await expect(access.changeUserPassword(
        { id: userInfo.id, account: testUserAccount },
        { oldPassword: testUserPassword + 'hogehoge', newPassword: newPassword }
      )).rejects.toThrow();

      // 現在のパスワードが正しい場合
      const newPassword1 = testUserPassword + 'hogehogehogehoge'
      await expect(access.changeUserPassword(
        { id: userInfo.id, account: testUserAccount },
        { oldPassword: testUserPassword, newPassword: newPassword1 }
      )).resolves.not.toThrow();

      await expect(access.changeUserPassword(
        { id: userInfo.id, account: testUserAccount },
        { oldPassword: newPassword1, newPassword: testUserPassword }
      )).resolves.not.toThrow();
    });
  });

  describe('ユーザー関連テスト', () => {
    const testUserAccount = [generateRandomString(), generateRandomString(), generateRandomString(), generateRandomString()];
    const testUserPassword = generateRandomString();
    const testEmail = generateRandomString() + '@' + generateRandomString() + '.com';
    const testWorkPatternName = generateRandomString();
    const testPrivilegeName = generateRandomString();

    beforeAll(async () => {
      const access = new DatabaseAccess(knex);

      await expect(access.addPrivilege({ name: testPrivilegeName })).resolves.not.toThrow();
      await expect(access.addWorkPattern({ name: testWorkPatternName, onTimeStart: '08:30', onTimeEnd: '17:30' })).resolves.not.toThrow();

      await expect(access.addUsers([
        {
          account: testUserAccount[0], password: testUserPassword,
          email: testEmail, name: '金子 星男', phonetic: 'カネコ ホシオ',
          privilegeName: testPrivilegeName, defaultWorkPatternName: testWorkPatternName,
          department: '浜松工場', section: '製造部'
        },
        {
          account: testUserAccount[1], password: testUserPassword,
          email: testEmail, name: '久保田 模試子', phonetic: 'クボタ モシコ',
          privilegeName: testPrivilegeName, defaultWorkPatternName: testWorkPatternName,
          department: '東名工場', section: '製造部'
        },
        {
          account: testUserAccount[2], password: testUserPassword,
          email: testEmail, name: '稲田 市兵衛', phonetic: 'イナダ イチベエ',
          privilegeName: testPrivilegeName, defaultWorkPatternName: testWorkPatternName,
          department: '名古屋事業所', section: '営業部'
        }, {
          account: testUserAccount[3], password: testUserPassword,
          email: testEmail, name: '山本 花絵', phonetic: 'ヤマモト ハナエ',
          privilegeName: testPrivilegeName, defaultWorkPatternName: testWorkPatternName,
          department: '名古屋事業所', section: '総務部'
        }
      ])).resolves.not.toThrow();

    });

    afterAll(async () => {
      const access = new DatabaseAccess(knex);

      await expect(access.deleteUser(testUserAccount[0])).resolves.not.toThrow();
      await expect(access.deleteUser(testUserAccount[1])).resolves.not.toThrow();
      await expect(access.deleteUser(testUserAccount[2])).resolves.not.toThrow();
      await expect(access.deleteUser(testUserAccount[3])).resolves.not.toThrow();

      const privileges = await access.getPrivileges();
      const privilegeId = privileges.find(privilege => privilege.name === testPrivilegeName).id;
      await expect(access.deletePrivilege(privilegeId)).resolves.not.toThrow();
    });

    test('getUser', async () => {
      const access = new DatabaseAccess(knex);

      let users = await access.getUsers({
        byName: '金子'
      });
      expect(users?.length).toBeDefined();
      expect(users.length).toBeGreaterThan(0);

      users = await access.getUsers({
        byPhonetic: 'ホシ'
      });
      expect(users?.length).toBeDefined();
      expect(users.length).toBeGreaterThan(0);

      users = await access.getUsers({
        byAccounts: [testUserAccount[0]]
      });
      expect(users?.length).toBeDefined();
      expect(users.length).toBeGreaterThan(0);

      users = await access.getUsers({
        byAccounts: [testUserAccount[0], testUserAccount[1]]
      });
      expect(users?.length).toBeDefined();
      expect(users.length).toBeGreaterThan(1);

      users = await access.getUsers({
        byDepartment: '浜松工場',
        bySection: '製造部'
      });
      expect(users?.length).toBeDefined();
      expect(users.length).toBeGreaterThan(0);

      /*
      userInfo = await access.getUsers({
        byDepartment: '東名工場',
        bySection: '製造部',
        limit: 25
      });
      //console.log(userInfo);
      expect(userInfo).toBeDefined();
      expect(userInfo.length).toBeLessThanOrEqual(25);
      */

      users = await access.getUsers({
        byName: '久保田',
        byDepartment: '東名工場'
      });
      //console.log(userInfo);
      expect(users?.length).toBeDefined();
      expect(users.length).toBeGreaterThan(0);

    });

    test('issueQrCodeRefreshToken && getUsersWithQrCodeIssued', async () => {
      const access = new DatabaseAccess(knex);
      let userInfo = await access.getUsers({ byAccounts: [testUserAccount[3]] });

      const qrCodeRefreshToken = await access.issueQrCodeRefreshToken(testUserAccount[3]);
      userInfo = await access.getUsers({ byAccounts: [testUserAccount[3]] });
      expect(userInfo.every(info => info.qrCodeIssuedNum === 0)).toBeFalsy();

      await access.revokeQrCodeRefreshToken(testUserAccount[3], qrCodeRefreshToken.refreshToken);
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
      /*
            let result = await access.getRecords({});
      
            result = await access.getRecords({
              byUserAccount: 'USR00'
            });
            //console.log(result);
      
            result = await access.getRecords({
              from: new Date('2022-03-12')
            });
            //console.log(result);
      
            result = await access.getRecords({
              to: new Date('2022-03-21')
            });
            //console.log(result);
      
            result = await access.getRecords({
              from: new Date('2022-03-01'),
              to: new Date('2022-03-21')
            });
            //console.log(result);
      
            result = await access.getRecords({
              byUserAccount: 'USR00',
              from: new Date('2022-03-01'),
              to: new Date('2022-03-21')
            });
            //console.log(result);
      
            result = await access.getRecords({
              byUserAccount: 'USR00',
              from: new Date('2022-03-01'),
              to: new Date('2022-03-21'),
            });
            //console.log(result);
      
            result = await access.getRecords({
              byUserName: '太郎',
              from: new Date('2022-03-01'),
              to: new Date('2022-03-21'),
            });
            //console.log(result);
      
            result = await access.getRecords({
              byDepartment: '浜松',
              sortBy: 'byDepartment',
              from: new Date('2022-03-01'),
              to: new Date('2022-03-21'),
              limit: 10
            });
            //console.log(result);
      
            result = await access.getRecords({
              byDepartment: '浜松',
              bySection: '製造',
              sortBy: 'byDepartment',
              from: new Date('2022-03-01'),
              to: new Date('2022-03-21'),
              limit: 10
            });
            //console.log(result);
      */
    });
  });

  describe('申請メール送信', () => {
    const access = new DatabaseAccess(knex);

    beforeAll(async () => {
    });

    test('sendApplyMail', async () => {
      //await expect(access.sendApplyMail(1, 'http://localhost:3001/#/approve/1')).resolves.not.toThrow();
    });

    test('sendApplyRejectedMail', async () => {
      //await expect(access.sendApplyRejectedMail(1, 'http://localhost:3001/#/approve/1')).resolves.not.toThrow();
    });

    test('sendApplyApprovedMail', async () => {
      //await expect(access.sendApplyApprovedMail(1, 'http://localhost:3001/#/approve/1')).resolves.not.toThrow();
    });
  });

  describe('その他テスト', () => {
    test('getSmtpServerInfo', async () => {
      const access = new DatabaseAccess(knex);
      const smtpInfo = await access.getSmtpServerInfo();
      //console.log(smtpInfo);
    });

    test('generateAvailableUserAccount', async () => {
      const access = new DatabaseAccess(knex);
      const candidates = await access.generateAvailableUserAccount();
      //console.log(candidates);
    });
  });

});
