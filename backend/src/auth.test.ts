import * as auth from './auth';
import lodash from 'lodash';

describe('auth', () => {
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
      const hash = auth.hashPassword(password);
      expect(auth.verifyPassword(hash, password)).toBeTruthy();
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
      let token = auth.issueRefreshToken(data);
      let dataResult = auth.verifyRefreshToken(token);

      expect(data).toEqual(lodash.omit(dataResult as object, ['exp', 'iat']));
    });

    // 期間指定あり
    objData.forEach(async (data) => {
      jest.useFakeTimers();

      const testIssueToken = (data: object, fromDate: Date, toDate: Date, isRefreshTokenTest: boolean = true) => {
        const periodSecs = (toDate.getTime() - fromDate.getTime()) / 1000;
        // 成功ケース
        jest.useFakeTimers().setSystemTime(fromDate.getTime());
        const successExpirationSeconds = periodSecs + 1;
        const tokenSuccess =
          isRefreshTokenTest ? auth.issueRefreshToken(data, successExpirationSeconds) : auth.issueAccessToken(data, successExpirationSeconds);
        jest.useFakeTimers().setSystemTime(toDate.getTime());
        expect(() => {
          const dataResult = isRefreshTokenTest ? auth.verifyRefreshToken(tokenSuccess, data) : auth.verifyAccessToken(tokenSuccess, data);
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
        const tokenFailOnVerification =
          isRefreshTokenTest ? auth.issueRefreshToken(data, successExpirationSeconds) : auth.issueAccessToken(data, successExpirationSeconds);
        jest.useFakeTimers().setSystemTime(toDate.getTime());
        expect(() => {
          const contaminatedData = { hogehogehoge: 'hugahuga' };
          const dataResult = isRefreshTokenTest ? auth.verifyRefreshToken(tokenFailOnVerification, contaminatedData) : auth.verifyAccessToken(tokenFailOnVerification, contaminatedData);
        }).toThrow();

        // 失敗ケース: 期限切れ
        jest.useFakeTimers().setSystemTime(fromDate.getTime());
        const failExpirationSeconds = periodSecs - 1;
        const tokenFail =
          isRefreshTokenTest ? auth.issueRefreshToken(data, failExpirationSeconds) : auth.issueAccessToken(data, failExpirationSeconds);
        jest.useFakeTimers().setSystemTime(toDate.getTime());
        expect(() => {
          const dataResult = isRefreshTokenTest ? auth.verifyRefreshToken(tokenFail, data) : auth.verifyAccessToken(tokenFail, data);
        }).toThrow();
      };

      // 30分
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-05-01T08:30:51'), true);
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-05-01T08:30:51'), false);

      // 1日
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-05-02T08:00:51'), true);
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-05-02T08:00:51'), false);

      // 1ヶ月
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-06-01T08:00:51'), true);
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2022-06-01T08:00:51'), false);

      // 1年
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2023-05-01T08:00:51'), true);
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2023-05-01T08:00:51'), false);

      // 5年
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2027-05-01T08:00:51'), true);
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2027-05-01T08:00:51'), false);

      // 10年
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2032-05-01T08:00:51'), true);
      testIssueToken(data, new Date('2022-05-01T08:00:51'), new Date('2032-05-01T08:00:51'), false);

      // 終了
      jest.runAllTimers();

    });

  });
})