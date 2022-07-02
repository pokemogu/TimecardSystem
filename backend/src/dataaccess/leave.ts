import type * as apiif from '../APIInterfaces';
import { DatabaseAccess, UserInfo } from '../dataaccess';

function setTimeToZero(date: Date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
}

///////////////////////////////////////////////////////////////////////
// 休日登録管理
///////////////////////////////////////////////////////////////////////

export async function setAnnualLeaves(this: DatabaseAccess, params: apiif.AnnualLeaveRequestData[]) {

  const leaves: { user: number, grantedAt: Date, expireAt: Date, dayAmount: number, hourAmount: number }[] = [];
  const userInfos = await this.getUsersInfo({ accounts: params.map(param => param.account) });

  for (const param of params) {
    // 有給付与日grantedAtが指定されていない場合は本日の日付とする。
    const grantedAtDate = param.grantedAt ? new Date(param.grantedAt) : new Date();
    setTimeToZero(grantedAtDate);

    // 有給期限日expireAtが指定されていない場合は付与日から2年後の日付とする。
    const expireAtDate = param.expireAt ? new Date(param.expireAt) : (() => {
      const date = new Date(grantedAtDate);
      date.setFullYear(date.getFullYear() + 2);
      return date
    })();
    setTimeToZero(expireAtDate);

    const userId = userInfos.find(userInfo => userInfo.account === param.account);
    if (userId) {
      leaves.push({
        user: userId.id,
        grantedAt: grantedAtDate,
        expireAt: expireAtDate,
        dayAmount: param.dayAmount,
        hourAmount: param.hourAmount
      });
    }
  }

  if (leaves.length > 0) {
    await this.knex('annualLeave').insert(leaves)
      .onConflict(['user', 'grantedAt', 'expireAt']).merge(['dayAmount', 'hourAmount']); // ON DUPLICATE KEY UPDATE
  }
}

export async function getAnnualLeaves(this: DatabaseAccess, params?: { account?: string }) {
  //type ResultRecord = { id: number, grantedAt: Date, expireAt: Date, dayAmount: number, hourAmount: number, userAccount: string };

  return await this.knex.select<apiif.AnnualLeaveResponseData[]>({
    id: 'annualLeave.id',
    grantedAt: 'annualLeave.grantedAt', expireAt: 'annualLeave.expireAt',
    dayAmount: 'annualLeave.dayAmount', hourAmount: 'annualLeave.hourAmount',
    userInfo: 'user.account'
  })
    .from('annualLeave')
    .leftJoin('user', { 'user.id': 'annualLeave.user' })
    .where(function (builder) {
      if (params?.account) {
        builder.where('user.account', params.account);
      }
    });
}

export async function deleteAnnualLeave(this: DatabaseAccess, id: number) {
  await this.knex('annualLeave').where('id', id).del();
}
