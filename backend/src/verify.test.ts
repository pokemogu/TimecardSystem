import { hashPassword, verifyPassword, generateKeyPair, setJsonWebTokenKey, issueJsonWebToken, verifyJsonWebToken } from './verify';
import lodash from 'lodash';

describe('auth', () => {
  beforeAll(() => {
    const { privateKey, publicKey } = generateKeyPair();
    setJsonWebTokenKey(privateKey, publicKey);
  });

  test('hashPassword & verifyPassword', () => {
    const passwords = [
      'password',
      'password001',
      'P@ssw0rd',
      '12345678',
      'RieVohb7ahaekae6',
      'ach9sohaeZae0evik0oocuthis8mey7d',
      'yu.g7oom,ieF6ohsoz|oo]zum6rudu0o'
    ].forEach((password) => {
      const hash = hashPassword(password);
      expect(verifyPassword(hash, password)).toBeTruthy();
    });
  });

  test('issueRefreshToken & verifyRefreshToken', () => {
    const objData = [
      { id: 12333 },
      { name: 'hogehoge' },
      { name: 'hugahuga', value: 'jagajaga' },
    ]

    // 期間指定なし(1日)
    objData.forEach((data) => {
      let token = issueJsonWebToken(data);
      let dataResult = verifyJsonWebToken(token);

      expect(data).toEqual(lodash.omit(dataResult as object, ['exp', 'iat']));
    });

    // 期間指定あり
    objData.forEach(async (data) => {
      jest.useFakeTimers();

      const testIssueToken = (data: object, fromDate: Date, toDate: Date) => {
        const periodSecs = (toDate.getTime() - fromDate.getTime()) / 1000;
        // 成功ケース
        jest.useFakeTimers().setSystemTime(fromDate.getTime());
        const successExpirationSeconds = periodSecs + 1;
        const tokenSuccess = issueJsonWebToken(data, successExpirationSeconds);
        jest.useFakeTimers().setSystemTime(toDate.getTime());
        expect(() => {
          const dataResult = verifyJsonWebToken(tokenSuccess, data);
          /* JWTの日時情報をローカル時間で出力するサンプルコードです。このテストソースコードからは消さないこと。
          console.log(dataResult);
          const tzOffset = new Date().getTimezoneOffset() * 60 * 1000;
          console.log('iat: ' + new Date((dataResult as any).iat * 1000 - tzOffset).toISOString());
          console.log('exp: ' + new Date((dataResult as any).exp * 1000 - tzOffset).toISOString());
          */
          expect(data).toEqual(lodash.omit(dataResult as object, ['exp', 'iat']));
        }).not.toThrow();

        // 失敗ケース: データ不整合
        jest.useFakeTimers().setSystemTime(fromDate.getTime());
        const tokenFailOnVerification = issueJsonWebToken(data, successExpirationSeconds);
        jest.useFakeTimers().setSystemTime(toDate.getTime());
        expect(() => {
          const contaminatedData = { hogehogehoge: 'hugahuga' };
          const dataResult = verifyJsonWebToken(tokenFailOnVerification, contaminatedData);
        }).toThrow();

        // 失敗ケース: 期限切れ
        jest.useFakeTimers().setSystemTime(fromDate.getTime());
        const failExpirationSeconds = periodSecs - 1;
        const tokenFail = issueJsonWebToken(data, failExpirationSeconds);
        jest.useFakeTimers().setSystemTime(toDate.getTime());
        expect(() => {
          const dataResult = verifyJsonWebToken(tokenFail, data);
        }).toThrow();
      };

      // 30分
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-05-01T08:30:51'));

      // 1日
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-05-02T08:00:51'));

      // 1ヶ月
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-06-01T08:00:51'));

      // 1年
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2023-05-01T08:00:51'));

      // 5年
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2027-05-01T08:00:51'));

      // 10年
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2032-05-01T08:00:51'));

      // 終了
      jest.runAllTimers();

    });

  });
})