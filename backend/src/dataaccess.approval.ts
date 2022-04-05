import lodash from 'lodash';
import { DatabaseAccess } from './dataaccess';
import type * as apiif from 'shared/APIInterfaces';
import { Console } from 'console';

///////////////////////////////////////////////////////////////////////
// 承認ルート関連
///////////////////////////////////////////////////////////////////////

/**
 * 全ての承認ルート情報を取得する
 *
 * @returns 承認ルート情報を全て返す
 */
export async function getApprovalRouteRoles(this: DatabaseAccess) {
  const roles = await this.knex.table<{ name: string, level: number }>('role');

  // 取得した承認役割情報を承認レベルごとにまとめる
  const rolesByLevel: apiif.ApprovalRouteRoleData[] = [];

  for (const role of roles) {
    const index = rolesByLevel.findIndex(roleByLevel => roleByLevel.level === role.level);
    if (index >= 0) {
      rolesByLevel[index].names.push(role.name);
    }
    else {
      rolesByLevel.push({ level: role.level, names: [role.name] });
    }
  }
  // 承認レベルの低い順にソートする
  rolesByLevel.sort((first, second) => first.level - second.level);

  return rolesByLevel;
}

/**
 * 承認ルート情報を新規追加する
 *
 * @param accessToken 実行権限を確認する為の実行者アクセストークン
 * @param route 新規追加する承認ルート情報
 */
export async function addApprovalRoute(this: DatabaseAccess, accessToken: string, route: apiif.ApprovalRouteRequestData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

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
  /*
  const routeInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('approvalRoute').where('name', route.name).first();

  // 改めて承認メンバー情報を追加する
  const members: { route: number, user: number, role: number }[] = [];
  for (const role of route.roles) {
    for (const user of role.users) {
      const userInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', user.account).first();
      const roleInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('role').where('name', user.role).first();
      members.push({ route: routeInfo.id, user: userInfo.id, role: roleInfo.id });
    }
  }
  await this.knex('approvalRouteMember').insert(members);
  */
}

/**
 * 承認ルート情報を全て取得する
 *
 * @param accessToken 実行権限を確認する為の実行者アクセストークン
 * @param params 取得する承認ルート情報の検索条件
 * @param routeIdOrName 取得する承認ルート情報のIDあるいは名称
 */
export async function getApprovalRoutes(this: DatabaseAccess, accessToken: string, params?: { limit: number, offset: number }, routeIdOrName?: number | string) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  return await this.knex.select<apiif.ApprovalRouteResposeData[]>({
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

  /*
  const roleMembers = await this.knex
    .select<{ routeId: number, routeName: string, roleName: string, level: number, userAccount: string, userName: string }[]>(
      { routeId: 'approvalRoute.id', routeName: 'approvalRoute.name', roleName: 'role.name', level: 'role.level', userAccount: 'user.account', userName: 'user.name' }
    )
    .from('approvalRouteMember')
    .join('approvalRoute', { 'approvalRoute.id': 'approvalRouteMember.route' })
    .join('user', { 'user.id': 'approvalRouteMember.user' })
    .join('role', { 'role.id': 'approvalRouteMember.role' })
    .where(function (builder) {
      if (routeIdOrName) {
        if (typeof routeIdOrName === 'string') {
          builder.where('approvalRoute.name', routeIdOrName);
        }
        else {
          builder.where('approvalRoute.id', routeIdOrName);
        }
      }
    })
    .orderBy('approvalRoute.name', 'desc');

  const routes: apiif.ApprovalRouteResposeData[] = [];
  for (const roleMember of roleMembers) {
    let routeIndex = routes.findIndex(route => route.name === roleMember.routeName);
    if (routeIndex < 0) {
      routeIndex = routes.push({ id: roleMember.routeId, name: roleMember.routeName, roles: [] }) - 1;
    }
    const route = routes[routeIndex];

    let levelIndex = route.roles.findIndex(role => role.level === roleMember.level);
    if (levelIndex < 0) {
      levelIndex = route.roles.push({ level: roleMember.level, users: [] }) - 1;
    }
    const role = route.roles[levelIndex];

    role.users.push({ role: roleMember.roleName, account: roleMember.userAccount, name: roleMember.userName });
  }

  // 各ルート内のロールを権限順にソートする
  for (const route of routes) {
    route.roles.sort((first, second) => first.level - second.level);
  }

  return routes.slice(params?.offset ? params.offset : 0, params?.limit ? params.offset + params.limit : undefined);
  */
}

/**
 * 承認ルート情報を更新する
 *
 * @param accessToken 実行権限を確認する為の実行者アクセストークン
 * @param route 更新する承認ルート情報内容 idかnameが指定されている必要がある
 */
export async function updateApprovalRoute(this: DatabaseAccess, accessToken: string, route: apiif.ApprovalRouteResposeData) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  /*
  const routeInfo = await this.knex
    .select<{ id: number, name: string }[]>({ id: 'id', name: 'name' })
    .from('approvalRoute')
    .where(function (builder) {
      if (route.id) {
        builder.where('id', route.id);
      }
      else {
        builder.where('name', route.name);
      }
    })
    .first();
    */

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

  /*
  // 一旦、対象ルートの既存承認メンバー情報は全て消す
  await this.knex('approvalRouteMember').del().where('route', routeInfo.id);

  // 改めて承認メンバー情報を追加する
  const members: { route: number, user: number, role: number }[] = [];
  for (const role of route.roles) {
    for (const user of role.users) {
      console.log(user);
      const userInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', user.account).first();
      const roleInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('role').where('name', user.role).first();
      members.push({ route: routeInfo.id, user: userInfo.id, role: roleInfo.id });
    }
  }
  await this.knex('approvalRouteMember').insert(members);
  */
}

/**
 * 承認ルート情報を削除する
 *
 * @param accessToken 実行権限を確認する為の実行者アクセストークン
 * @param id 削除する承認ルート情報のID
 */
export async function deleteApprovalRoute(this: DatabaseAccess, accessToken: string, id: number) {
  const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

  //await this.knex('approvalRouteMember').del().where('route', id);
  await this.knex('approvalRoute').del().where('id', id);
}
