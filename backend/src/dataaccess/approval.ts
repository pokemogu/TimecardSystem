import { DatabaseAccess } from '../dataaccess';
import type * as apiif from '../APIInterfaces';

///////////////////////////////////////////////////////////////////////
// 承認ルート関連
///////////////////////////////////////////////////////////////////////

/**
 * 承認ルート情報を新規追加する
 * @param route 新規追加する承認ルート情報
 */
export async function addApprovalRoute(this: DatabaseAccess, route: apiif.ApprovalRouteRequestData) {

  await this.knex('approvalRoute').insert({
    name: route.name,
    approvalLevel1MainUser: route.approvalLevel1MainUserId,
    approvalLevel1SubUser: route.approvalLevel1SubUserId,
    approvalLevel2MainUser: route.approvalLevel2MainUserId,
    approvalLevel2SubUser: route.approvalLevel2SubUserId,
    approvalLevel3MainUser: route.approvalLevel3MainUserId,
    approvalLevel3SubUser: route.approvalLevel3SubUserId,
    approvalDecisionUser: route.approvalDecisionUserId
  });
}

/**
 * 承認ルート情報を全て取得する
 * @param params 取得する承認ルート情報の検索条件
 * @param routeName 取得する承認ルート情報のIDあるいは名称
 */
export async function getApprovalRoutes(this: DatabaseAccess, params?: { limit: number, offset: number }, routeName?: string) {

  return await this.knex.select<apiif.ApprovalRouteResponseData[]>({
    id: 'approvalRoute.id', name: 'approvalRoute.name',
    approvalLevel1MainUserId: 'u1_1.id', approvalLevel1MainUserAccount: 'u1_1.account', approvalLevel1MainUserName: 'u1_1.name',
    approvalLevel1SubUserId: 'u1_2.id', approvalLevel1SubUserAccount: 'u1_2.account', approvalLevel1SubUserName: 'u1_2.name',
    approvalLevel2MainUserId: 'u2_1.id', approvalLevel2MainUserAccount: 'u2_1.account', approvalLevel2MainUserName: 'u2_1.name',
    approvalLevel2SubUserId: 'u2_2.id', approvalLevel2SubUserAccount: 'u2_2.account', approvalLevel2SubUserName: 'u2_2.name',
    approvalLevel3MainUserId: 'u3_1.id', approvalLevel3MainUserAccount: 'u3_1.account', approvalLevel3MainUserName: 'u3_1.name',
    approvalLevel3SubUserId: 'u3_2.id', approvalLevel3SubUserAccount: 'u3_2.account', approvalLevel3SubUserName: 'u3_2.name',
    approvalDecisionUserId: 'u4.id', approvalDecisionUserAccount: 'u4.account', approvalDecisionUserName: 'u4.name',
  })
    .from('approvalRoute')
    .leftJoin('user as u1_1', { 'u1_1.id': 'approvalRoute.approvalLevel1MainUser' })
    .leftJoin('user as u1_2', { 'u1_2.id': 'approvalRoute.approvalLevel1SubUser' })
    .leftJoin('user as u2_1', { 'u2_1.id': 'approvalRoute.approvalLevel2MainUser' })
    .leftJoin('user as u2_2', { 'u2_2.id': 'approvalRoute.approvalLevel2SubUser' })
    .leftJoin('user as u3_1', { 'u3_1.id': 'approvalRoute.approvalLevel3MainUser' })
    .leftJoin('user as u3_2', { 'u3_2.id': 'approvalRoute.approvalLevel3SubUser' })
    .leftJoin('user as u4', { 'u4.id': 'approvalRoute.approvalDecisionUser' })
    .where(function (builder) {
      if (routeName) {
        builder.where('approvalRoute.name', routeName);
      }
    });
}

/**
 * 承認ルート情報を更新する
 * @param route 更新する承認ルート情報内容 idかnameが指定されている必要がある
 */
export async function updateApprovalRoute(this: DatabaseAccess, route: apiif.ApprovalRouteResponseData) {

  await this.knex('approvalRoute')
    .where('id', route.id)
    .update({
      name: route.name,
      approvalLevel1MainUser: route.approvalLevel1MainUserId === undefined ? null : route.approvalLevel1MainUserId,
      approvalLevel1SubUser: route.approvalLevel1SubUserId === undefined ? null : route.approvalLevel1SubUserId,
      approvalLevel2MainUser: route.approvalLevel2MainUserId === undefined ? null : route.approvalLevel2MainUserId,
      approvalLevel2SubUser: route.approvalLevel2SubUserId === undefined ? null : route.approvalLevel2SubUserId,
      approvalLevel3MainUser: route.approvalLevel3MainUserId === undefined ? null : route.approvalLevel3MainUserId,
      approvalLevel3SubUser: route.approvalLevel3SubUserId === undefined ? null : route.approvalLevel3SubUserId,
      approvalDecisionUser: route.approvalDecisionUserId === undefined ? null : route.approvalDecisionUserId
    });
}

/**
 * 承認ルート情報を削除する
 * @param id 削除する承認ルート情報のID
 */
export async function deleteApprovalRoute(this: DatabaseAccess, id: number) {
  await this.knex('approvalRoute').del().where('id', id);
}
