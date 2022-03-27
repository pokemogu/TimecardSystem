import lodash from 'lodash';
import type { Knex } from 'knex';
import { hashPassword, verifyPassword, issueRefreshToken, verifyRefreshToken, issueAccessToken, verifyAccessToken } from './auth';

import type * as models from 'shared/models';
import type * as apiif from 'shared/APIInterfaces';

export class DatabaseAccess {
  private knex: Knex;

  constructor(knex: Knex) {
    this.knex = knex;
  }

  ///////////////////////////////////////////////////////////////////////
  // 基本不変なデータベース内データ(マスターデータ等)のキャッシュ保持
  ///////////////////////////////////////////////////////////////////////

  private static recordTypeCache: { [name: string]: { id: number, description: string } } = {};

  public static async initCache(knex: Knex) {
    const recordTypes = await knex.select<{
      id: number, name: string, description: string
    }[]>({ id: 'id', name: 'name', description: 'description' })
      .from('recordType');

    for (const recordType of recordTypes) {
      DatabaseAccess.recordTypeCache[recordType.name] = { id: recordType.id, description: recordType.description };
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 認証関連
  ///////////////////////////////////////////////////////////////////////

  public async issueRefreshToken(account: string, password: string): Promise<apiif.IssueTokenResponseData> {

    // 部門や部署に所属していない可能性があるのでLEFT JOINとする。
    const user = await this.knex.select<{
      id: number, available: boolean, account: string, password: string, name: string, department: string, section: string
    }>({ id: 'user.id', available: 'user.available', account: 'user.account', password: 'user.password', name: 'user.name', department: 'department.name', section: 'section.name' })
      .from('user')
      .leftJoin('section', { 'user.section': 'section.id' })
      .leftJoin('department', { 'section.department': 'department.id' })
      .where('user.account', account)
      .first();

    if (!user) {
      const error = new Error('password verification failed.');
      error.name = 'AuthenticationError';
      throw error;
    }

    if (!verifyPassword(user.password, password)) {
      const error = new Error('password verification failed.');
      error.name = 'AuthenticationError';
      throw error;
    }

    if (!user.available) {
      const error = new Error('user is not available.');
      error.name = 'UserNotAvailableError';
      throw error;
    }

    // 通常のトークン期限は1日
    const secondsPerDay = 60 * 60 * 24;
    const token = issueRefreshToken({ account: account }, secondsPerDay);
    await this.knex('token').insert({
      user: user.id,
      refreshToken: token,
      isQrToken: false
    });

    return { refreshToken: token, name: user.name, department: user.department, section: user.section };
  }

  public async issueQrCodeRefreshToken(accessToken: string, account: string): Promise<apiif.IssueTokenResponseData> {

    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
    const privilege = await this.getUserPrivilege(authUserInfo.id);

    // QRコード発行の権限が無い場合はエラー
    if (!privilege.issueQr) {
      const error = new Error('qr code issueing not allowed.');
      error.name = 'PermissionDeniedError';
      throw error;
    }

    // 部門や部署に所属していない可能性があるのでLEFT JOINとする。
    const user = await this.knex.select<{
      id: number, available: boolean, account: string, name: string, department: string, section: string
    }>({ id: 'user.id', available: 'user.available', account: 'user.account', name: 'user.name', department: 'department.name', section: 'section.name' })
      .from('user')
      .leftJoin('section', { 'user.section': 'section.id' })
      .leftJoin('department', { 'section.department': 'department.id' })
      .where('user.account', account)
      .first()

    if (!user.available) {
      const error = new Error('user is not available.');
      error.name = 'UserNotAvailableError';
      throw error;
    }

    // QRコード用のトークン期限は10年とする
    const secondsPerDay = 60 * 60 * 24;
    const refreshToken = issueRefreshToken({ account: account }, secondsPerDay * 3650);
    await this.knex('token').insert({
      user: user.id,
      refreshToken: refreshToken,
      isQrToken: true
    });

    return { refreshToken: refreshToken, name: user.name, department: user.department, section: user.section };
  }

  public async issueAccessToken(token: string) {
    const tokenData = await this.knex.select<{ account: string, tokenId: number, refreshToken: string }>(
      { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
    )
      .from('user')
      .join('token', { 'user.id': 'token.user' })
      .where('token.refreshToken', token)
      .first();

    if (!tokenData) {
      const error = new Error('refresh token does not exist.');
      error.name = 'AuthenticationError';
      throw error;
    }

    if (!verifyRefreshToken(token, { account: tokenData.account })) {
      throw new Error('refresh token verification failed.');
    }

    const accessToken = issueAccessToken({ account: tokenData.account }, 60);
    await this.knex('token').update({
      accessToken: accessToken
    })
      .where('id', tokenData.tokenId)

    return accessToken;
  }

  public async getUserInfoFromAccessToken(token: string): Promise<{
    id: number,
    account: string,
    section: number,
    email: string,
    phonetic: string,
    privilege: number
  }> {
    const userData = await this.knex.select<{ id: number, account: string, section: number, email: string, phonetic: string, privilege: number }>(
      { id: 'user.id', account: 'user.account', section: 'user.section', email: 'user.email', phonetic: 'user.phonetic', privilege: 'user.privilege' }
    )
      .from('user')
      .join('token', { 'user.id': 'token.user' })
      .where('token.accessToken', token)
      .first();

    if (!userData) {
      throw new Error('access token does not exist');
    }

    if (!verifyAccessToken(token, { account: userData.account })) {
      throw new Error('access token verification failed.');
    }

    return userData;
  }

  public async revokeRefreshToken(account: string, token: string) {
    if (!verifyRefreshToken(token, { account: account })) {
      throw new Error('refresh token verification failed.');
    }

    const user = await this.knex.select<{ id: number }>({ id: 'user.id' })
      .from('user')
      .where('user.account', account)
      .first();

    await this.knex('token').where('user', user.id).del();
  }

  public async deleteAllExpiredRefreshTokens() {
    const tokenData = await this.knex.select<{ account: string, tokenId: number, refreshToken: string }[]>(
      { account: 'user.account', tokenId: 'token.id', refreshToken: 'token.refreshToken' }
    )
      .from('token')
      .join('user', { 'user.id': 'token.user' })

    for (const token of tokenData) {
      try {
        verifyRefreshToken(token.refreshToken, { account: token.account });
      } catch (error: unknown) {
        if ((error as Error).name === 'TokenExpiredError') {
          await this.knex('token').del().where('id', token.tokenId);
        }
        else {
          throw error;
        }
      }
    }
  }

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

  ///////////////////////////////////////////////////////////////////////
  // 承認ルート関連
  ///////////////////////////////////////////////////////////////////////
  public async getApprovalRouteRoles() {
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

  public async addApprovalRoute(accessToken: string, route: apiif.ApprovalRouteRequestData) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    await this.knex('approvalRoute').insert({ name: route.name });
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
  }

  public async getApprovalRoutes(accessToken: string, params?: { limit: number, offset: number }, routeIdOrName?: number | string) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

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
  }

  public async updateApprovalRoute(accessToken: string, route: apiif.ApprovalRouteResposeData) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

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

    if (routeInfo.name !== route.name) {
      await this.knex('approvalRoute')
        .where('id', routeInfo.id)
        .update({ name: route.name })
    }

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
  }

  public async deleteApprovalRoute(accessToken: string, id: number) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    await this.knex('approvalRouteMember').del().where('route', id);
    await this.knex('approvalRoute').del().where('id', id);
  }

  ///////////////////////////////////////////////////////////////////////
  // 申請関連
  ///////////////////////////////////////////////////////////////////////
  public async submitApply(accessToken: string, applyType: string, apply: apiif.ApplyRequestBody) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
    if (!authUserInfo) {
      const error = new Error('invalid access token');
      error.name = 'AuthenticationError';
      throw error;
    }

    const applyTypeInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('applyType').where('name', applyType).first();
    let userId = authUserInfo.id;
    if (apply.targetUserAccount) {
      const targetUserInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('user').where('account', apply.targetUserAccount).first();
      if (targetUserInfo) {
        userId = targetUserInfo.id;
      }
    }

    const routeInfo = await this.knex.select<{ id: number }[]>({ id: 'id' }).from('approvalRoute').where('name', apply.route).first();
    if (!routeInfo) {
      throw new Error(`invalid route name ${apply.route} specified`);
    }

    await this.knex('apply').insert({
      type: applyTypeInfo.id,
      user: userId,
      appliedUser: authUserInfo.id,
      timestamp: new Date(apply.timestamp),
      dateFrom: new Date(apply.dateFrom),
      dateTo: apply.dateTo ? new Date(apply.dateTo) : undefined,
      dateRelated: apply.dateRelated ? new Date(apply.dateRelated) : undefined,
      reason: apply.reason ? apply.reason : undefined,
      contact: apply.contact ? apply.contact : undefined,
      route: routeInfo.id
    });

    const lastApplyResult = await this.knex.select<{ [name: string]: number }>(this.knex.raw('LAST_INSERT_ID()')).first();
    const lastApplyId = lastApplyResult['LAST_INSERT_ID()'];

    // オプション指定があれば合わせて保存する
    if (apply.options) {
      const applyOptionTypeInfo = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('applyOptionType')
      const applyOptionValueInfo = await this.knex.select<{ id: number, name: string }[]>({ id: 'id', name: 'name' }).from('applyOptionValue')

      const applyOptions: { apply: number, optionType: number, optionValue: number }[] = [];
      for (const option of apply.options) {
        applyOptions.push({
          apply: lastApplyId,
          optionType: applyOptionTypeInfo.find(info => info.name === option.name).id,
          optionValue: applyOptionValueInfo.find(info => info.name === option.value).id
        });
      }
      await this.knex('applyOption').insert(applyOptions);
    }

    return lastApplyId;
  }

  ///////////////////////////////////////////////////////////////////////
  // 申請タイプ情報関連
  ///////////////////////////////////////////////////////////////////////
  public async getApplyTypes() {

    const applyTypes = await this.knex
      .select<{ name: string, description: string }[]>
      ({ name: 'name' }, { description: 'description' })
      .from('applyType');

    return applyTypes;
  }

  public async getApplyOptionTypes(applyType: string) {

    const optionTypes = await this.knex
      .select<{ typeName: string, typeDescription: string, optionName: string, optionDescription: string }[]>
      (
        { typeName: 'applyOptionType.name' }, { typeDescription: 'applyOptionType.description' },
        { optionName: 'applyOptionValue.name' }, { optionDescription: 'applyOptionValue.description' }
      )
      .from('applyOptionType')
      .join('applyType', { 'applyType.id': 'applyOptionType.type' })
      .join('applyOptionValue', { 'applyOptionValue.optionType': 'applyOptionType.id' })
      .where('applyType.name', applyType);

    const result: apiif.ApplyOptionsResponseData[] = [];

    for (const optionType of optionTypes) {
      const sameType = result.find((elem) => elem.name === optionType.typeName);
      if (!sameType) {
        result.push({
          name: optionType.typeName,
          description: optionType.typeDescription,
          options: [{
            name: optionType.optionName,
            description: optionType.optionDescription
          }]
        });
      }
      else {
        sameType.options.push({
          name: optionType.optionName,
          description: optionType.optionDescription
        });
      }
    }

    return result;
  }

  ///////////////////////////////////////////////////////////////////////
  // 権限情報関連
  ///////////////////////////////////////////////////////////////////////
  public async registerPrivilege(privilegeData: {

  }) {
    const privilege = lodash.omit(privilegeData, ['id']);

    await this.knex('privilege').insert(privilege);
  }

  public async deletePrivilege(idOrName: string | number) {

    if (typeof idOrName === 'string') {
      return await this.knex('privilege').del().where('name', idOrName);
    }
    else {
      return await this.knex('privilege').del().where('id', idOrName);
    }
  }

  public async getUserPrivilege(idOrAccount: string | number): Promise<models.Privilege> {
    if (typeof idOrAccount === 'string') {
      return await this.knex.table<models.Privilege>('privilege')
        .first()
        .join('user', { 'user.privilege': 'privilege.id' })
        .where('user.account', idOrAccount);
    }
    else {
      return await this.knex.table<models.Privilege>('privilege')
        .first()
        .join('user', { 'user.privilege': 'privilege.id' })
        .where('user.id', idOrAccount);
    }
  }

  public async getPrivileges() {
    return await this.knex.table<apiif.PrivilegeResponseData>('privilege');
  }

  ///////////////////////////////////////////////////////////////////////
  // ユーザー情報関連
  ///////////////////////////////////////////////////////////////////////

  public async getUsers(accessToken: string, params: {
    byId?: number,
    isAvailable?: boolean,
    byAccount?: string,
    byName?: string,
    byPhonetic?: string,
    bySection?: string,
    byDepartment?: string,
    registeredFrom?: Date,
    registeredTo?: Date,
    isQrCodeIssued?: boolean,
    limit?: number,
    offset?: number
  }) {
    type RecordResult = {
      id: number,
      isAvailable: boolean,
      registeredAt: Date,
      account: string,
      name: string,
      phonetic: string,
      email: string,
      department: string,
      section: string
      privilege: string,
      qrCodeIssuedNum: number
    };
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);
    const result = await this.knex
      .select<RecordResult[]>
      (
        { id: 'user.id' }, { isAvailable: 'user.available' }, { registeredAt: 'user.registeredAt' }, { account: 'user.account' }, { name: 'user.name' }, { email: 'user.email' },
        { phonetic: 'user.phonetic' }, { department: 'department.name' }, { section: 'section.name' }, { privilege: 'privilege.name' },
      )
      .sum('token.isQrToken', { as: 'qrCodeIssuedNum' })
      .from('user')
      .leftJoin('section', { 'section.id': 'user.section' })
      .leftJoin('department', { 'department.id': 'section.department' })
      .join('privilege', { 'privilege.id': 'user.privilege' })
      .leftJoin('token', { 'token.user': 'user.id' })
      .where(function (builder) {
        if (params.byId) {
          builder.where('user.id', params.byId);
        }

        if (params.isAvailable === false) {
          builder.where('user.available', false);
        }
        else {
          builder.where('user.available', true);
        }

        if (params.byAccount) {
          builder.where('user.account', params.byAccount);
        }
        if (params.byName) {
          builder.where('user.name', 'like', `%${params.byName}%`);
        }
        if (params.byPhonetic) {
          builder.where('user.phonetic', 'like', `%${params.byPhonetic}%`);
        }
        if (params.bySection) {
          builder.where('section.name', 'like', `%${params.bySection}%`);
        }
        if (params.byDepartment) {
          builder.where('department.name', 'like', `%${params.byDepartment}%`);
        }
        if (params.registeredFrom && params.registeredTo) {
          builder.whereBetween('registeredAt', [params.registeredFrom, params.registeredTo]);
        }
        else if (params.registeredFrom) {
          builder.where('registeredAt', '>=', params.registeredFrom);
        }
        else if (params.registeredTo) {
          builder.where('registeredAt', '<=', params.registeredTo);
        }
      })
      .modify(function (builder) {
        if (params.isQrCodeIssued !== undefined && params.isQrCodeIssued !== null) {
          if (params.isQrCodeIssued.toString() === 'true') {
            builder.having('qrCodeIssuedNum', '>', 0);
          }
          else if (params.isQrCodeIssued.toString() === 'false') {
            builder.havingRaw('qrCodeIssuedNum is null');
            builder.orHaving('qrCodeIssuedNum', '=', 0);
          }
        }
      })
      .groupBy('user.id')
      .modify(function (builder) {
        if (params.limit) {
          builder.limit(params.limit);
        }
        if (params.offset) {
          builder.offset(params.offset);
        }
      })
      .orderBy('user.registeredAt', 'desc');

    return <RecordResult[]>result;
  }

  public async generateAvailableUserAccount() {
    const result = await this.knex
      .select<{ account: string }[]>
      (
        { account: 'account' }
      )
      .from('user');

    const users = result as { account: string }[];

    const candidates: { prefix: string, id: number, length: number }[] = [];
    for (const user of users) {
      const account = user.account;
      const matches = account.match(/^(\D+)(\d+)$/);
      if (matches && matches.length > 2) {
        const prefix = matches[1];
        const id = parseInt(matches[2]);
        const length = matches[2].length;

        const index = candidates.findIndex(candidate => candidate.prefix === prefix && candidate.length === length);
        if (index < 0) {
          candidates.push({
            prefix: prefix,
            id: id,
            length: length
          });
        }
        else {
          if (id >= candidates[index].id) {
            candidates[index].id = id + 1;
          }
        }
      }
    }

    return candidates.map(candidate => candidate.prefix + candidate.id.toString().padStart(candidate.length, '0'));
  }

  public async registerUser(accessToken: string, userData: models.User, password: string, params?: {
    department?: string, section?: string, privilege?: string
  }) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    const user = lodash.omit(userData, ['id']);
    user.password = hashPassword(password);

    if (params) {

    } else {

    }

    await this.knex('user').insert(user);
  }

  public async deleteUser(idOrAccount: number | string) {

    if (typeof idOrAccount === 'string') {
      await this.knex('user').del().where('account', idOrAccount);
    }
    else {
      await this.knex('user').del().where('id', idOrAccount);
    }
  }

  public async disableUser(idOrAccount: number | string) {

    if (typeof idOrAccount === 'string') {
      await this.knex('user').update({ available: false }).where('account', idOrAccount);
    }
    else {
      await this.knex('user').update({ available: false }).where('id', idOrAccount);
    }
  }

  public async changeUserPassword(accessToken: string, account: string | null, oldPassword: string, newPassword: string) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    if (!account) {
      const userInfo = await this.knex.table<models.User>('user').first().where('id', authUserInfo.id);
      if (!verifyPassword(userInfo.password, oldPassword)) {
        throw new Error('invalid password');
      }
      await this.knex('user').update({
        password: hashPassword(newPassword)
      })
        .where('id', userInfo.id);
    } else {
      const userInfo = await this.knex.table<models.User>('user').first().where('account', account);
      if (!verifyPassword(userInfo.password, oldPassword)) {
        const error = new Error('password verification failed.');
        error.name = 'AuthenticationError';
        throw error;
      }
      await this.knex('user').update({
        password: hashPassword(newPassword)
      })
        .where('id', userInfo.id);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 打刻情報関連
  ///////////////////////////////////////////////////////////////////////

  public async putRecord(accessToken: string, type: string, timestamp: Date, device?: string, deviceToken?: string) {

    // type はデータベースから取得済のキャッシュを利用する
    if (!(type in DatabaseAccess.recordTypeCache)) {
      throw new Error('invalid type');
    }

    const userInfo = await this.getUserInfoFromAccessToken(accessToken);

    await this.knex('record').insert([
      {
        user: userInfo.id,
        type: DatabaseAccess.recordTypeCache[type].id,
        device: device,
        timestamp: timestamp
      }
    ]);
  }

  public async getRecords(params: {
    byUserAccount?: string,
    byUserName?: string,
    bySection?: string,
    byDepartment?: string,
    byDevice?: string,
    sortBy?: 'byUserAccount' | 'byUserName' | 'bySection' | 'byDepartment',
    sortDesc?: boolean, // true:昇順、false:降順、undefined:ソートなし
    from?: Date,
    to?: Date,
    sortDateDesc?: boolean, // true:昇順、false:降順、undefined:ソートなし
    limit?: number,
    offset?: number
  }) {
    type RecordResult = {
      id: number,
      type: string,
      typeDescription: string,
      timestamp: Date,
      userAccount: string,
      userName: string,
      department?: string,
      section?: string
    };

    const result = await this.knex
      .select<RecordResult[]>
      (
        { id: 'record.id' }, { type: 'recordType.name' }, { typeDescription: 'recordType.description' },
        { timestamp: 'record.timestamp' }, { userAccount: 'user.account' }, { userName: 'user.name' }, { department: 'department.name' }, { section: 'section.name' }
      )
      .from('record')
      .join('recordType', { 'recordType.id': 'record.type' })
      .join('user', { 'user.id': 'record.user' })
      .join('device', { 'device.id': 'record.device' })
      .leftJoin('section', { 'section.id': 'user.section' })
      .leftJoin('department', { 'department.id': 'section.department' })
      .where(function (builder) {
        if (params.byUserAccount) {
          builder.where('user.account', 'like', `%${params.byUserAccount}%`);
        }
        if (params.byUserName) {
          builder.where('user.name', 'like', `%${params.byUserName}%`);
        }
        if (params.bySection) {
          builder.where('section.name', 'like', `%${params.bySection}%`);
        }
        if (params.byDepartment) {
          builder.where('department.name', 'like', `%${params.byDepartment}%`);
        }
        if (params.byDevice) {
          builder.where('department.name', 'like', `%${params.byDepartment}%`);
        }
        if (params.from && params.to) {
          builder.whereBetween('timestamp', [params.from, params.to]);
        }
        else if (params.from) {
          builder.where('timestamp', '>=', params.from);
        }
        else if (params.to) {
          builder.where('timestamp', '<=', params.to);
        }
      })
      .modify(function (builder) {
        if (params.sortBy === 'byUserAccount') {
          builder.orderBy('user.account', params.sortDesc ? 'desc' : 'asc')
        }
        else if (params.sortBy === 'byUserName') {
          builder.orderBy('user.name', params.sortDesc ? 'desc' : 'asc')
        }
        else if (params.sortBy === 'byDepartment') {
          builder.orderBy('department.name', params.sortDesc ? 'desc' : 'asc')
        }
        else if (params.sortBy === 'bySection') {
          builder.orderBy('section.name', params.sortDesc ? 'desc' : 'asc')
        }
        if (params.limit) {
          builder.limit(params.limit);
        }
        if (params.offset) {
          builder.offset(params.offset);
        }
      });

    return result;
  }

  ///////////////////////////////////////////////////////////////////////
  // 勤務体系
  ///////////////////////////////////////////////////////////////////////

  public async addWorkPattern(accessToken: string, workPattern: apiif.WorkPatternRequestData) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    await this.knex('workPattern').insert({
      name: workPattern.name,
      onTimeStart: workPattern.onTimeStart,
      onTimeEnd: workPattern.onTimeEnd
    });

    const workPatternId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('workPattern').where('name', workPattern.name).first()).id;

    // 勤務時間帯情報を追加する
    const wagePatterns: {
      workPattern: number, name: string, timeStart: string, timeEnd: string,
      normalWagePercentage: number, holidayWagePercentage: number
    }[] = [];
    for (const pattern of workPattern.wagePatterns) {
      wagePatterns.push({
        workPattern: workPatternId, name: pattern.name, timeStart: pattern.timeStart, timeEnd: pattern.timeEnd,
        normalWagePercentage: pattern.normalWagePercentage, holidayWagePercentage: pattern.holidayWagePercentage
      });
    }

    if (wagePatterns.length > 0) {
      await this.knex('wagePattern').insert(wagePatterns);
    }
  }

  public async getWorkPatterns(accessToken: string, params?: { limit: number, offset: number }) {
    const userInfo = await this.getUserInfoFromAccessToken(accessToken);

    return await this.knex
      .select<apiif.WorkPatternsResponseData[]>
      (
        { id: 'workPattern.id' }, { name: 'workPattern.name' }, { onTimeStart: 'onTimeStart' }, { onTimeEnd: 'onTimeEnd' }
      )
      .from('workPattern')
      .modify(function (builder) {
        if (params.limit) {
          builder.limit(params.limit);
        }
        if (params.offset) {
          builder.offset(params.offset);
        }
      }) as apiif.WorkPatternsResponseData[];
  }

  public async getWorkPattern(accessToken: string, idOrName: number | string, params?: { limit: number, offset: number }) {
    const userInfo = await this.getUserInfoFromAccessToken(accessToken);

    const workPatternResult = await this.knex
      .select<{
        id: number, name: string, onTimeStart: string, onTimeEnd: string,
      }[]>
      (
        { id: 'id' }, { name: 'name' }, { onTimeStart: 'onTimeStart' }, { onTimeEnd: 'onTimeEnd' }
      )
      .from('workPattern')
      .where(function (builder) {
        if (typeof idOrName === 'string') {
          builder.where('workPattern.name', idOrName);
        }
        else {
          builder.where('workPattern.id', idOrName);
        }
      })
      .modify(function (builder) {
        if (params.limit) {
          builder.limit(params.limit);
        }
        if (params.offset) {
          builder.offset(params.offset);
        }
      })
      .first();

    const wagePatternResult = await this.knex
      .select<{
        id: number, name: string, timeStart: string, timeEnd: string,
        normalWagePercentage: number, holidayWagePercentage: number
      }[]>
      (
        { id: 'id' }, { name: 'name' }, { timeStart: 'timeStart' }, { timeEnd: 'timeEnd' },
        { normalWagePercentage: 'normalWagePercentage' }, { holidayWagePercentage: 'holidayWagePercentage' }
      )
      .from('wagePattern')
      .where('workPattern', workPatternResult.id);

    return <apiif.WorkPatternResponseData>{
      id: workPatternResult.id,
      name: workPatternResult.name,
      onTimeStart: workPatternResult.onTimeStart,
      onTimeEnd: workPatternResult.onTimeEnd,
      wagePatterns: wagePatternResult
    };
  }

  public async updateWorkPattern(accessToken: string, workPattern: apiif.WorkPatternRequestData) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    await this.knex('workPattern')
      .where('id', workPattern.id)
      .update({
        name: workPattern.name,
        onTimeStart: workPattern.onTimeStart,
        onTimeEnd: workPattern.onTimeEnd
      });

    const workPatternId = (await this.knex.select<{ id: number }[]>({ id: 'id' }).from('workPattern').where('name', workPattern.name).first()).id;

    // 一旦、対象勤務体系の既存勤務時間帯情報は全て消す
    await this.knex('wagePattern').del().where('workPattern', workPattern.id);

    // 勤務時間帯情報を追加する
    const wagePatterns: {
      workPattern: number, name: string, timeStart: string, timeEnd: string,
      normalWagePercentage: number, holidayWagePercentage: number
    }[] = [];
    for (const pattern of workPattern.wagePatterns) {
      wagePatterns.push({
        workPattern: workPatternId, name: pattern.name, timeStart: pattern.timeStart, timeEnd: pattern.timeEnd,
        normalWagePercentage: pattern.normalWagePercentage, holidayWagePercentage: pattern.holidayWagePercentage
      });
    }

    if (wagePatterns.length > 0) {
      await this.knex('wagePattern').insert(wagePatterns);
    }
  }

  public async deleteWorkPattern(accessToken: string, id: number) {
    const authUserInfo = await this.getUserInfoFromAccessToken(accessToken);

    await this.knex('wagePattern').del().where('workPattern', id);
    await this.knex('workPattern').del().where('id', id);
  }

  ///////////////////////////////////////////////////////////////////////
  // メールキュー
  ///////////////////////////////////////////////////////////////////////

  public async queueMail(params: {
    from: string, to: string, cc?: string, subject: string, body: string
  }) {

    await this.knex('mailQueue').insert([
      {
        from: params.from,
        to: params.to,
        cc: params.cc,
        subject: params.subject,
        body: params.body,
        timestamp: new Date()
      }
    ]);
  }

  public async getMails() {

    return await this.knex
      .select<{ id: number, from: string, to: string, cc: string, subject: string, body: string, timestamp: Date }[]>
      (
        { id: 'id' }, { from: 'from' }, { to: 'to' }, { cc: 'cc' }, { subject: 'subject' }, { body: 'body' }, { timestamp: 'timestamp' }
      )
      .from('mailQueue');
  }

  public async deleteMail(id: number) {
    await this.knex('mailQueue').where('id', id).del();
  }

  ///////////////////////////////////////////////////////////////////////
  // その他内部情報の取得など
  ///////////////////////////////////////////////////////////////////////

  public async getSmtpServerInfo() {

    if (await this.knex.schema.hasTable('config')) {
      const configValues = await this.knex
        .select<{ key: string, value: string }[]>
        ({ key: 'key' }, { value: 'value' })
        .from('config')
        .where('key', 'like', 'smtp%');

      if (!configValues) {
        return undefined;
      }

      let smtpHost = '';
      let smtpPort = 0;
      let smtpUsername = '';
      let smtpPassword = '';

      configValues.forEach((configValue) => {
        if (configValue.key === 'smtpHost') {
          smtpHost = configValue.value;
        }
        else if (configValue.key === 'smtpPort') {
          smtpPort = parseInt(configValue.value);
        }
        else if (configValue.key === 'smtpUsername') {
          smtpUsername = configValue.value;
        }
        else if (configValue.key === 'smtpPassword') {
          smtpPassword = configValue.value;
        }
      });

      if (smtpHost !== '' && smtpPort !== 0 && smtpUsername !== '' && smtpPassword !== '') {
        return {
          host: smtpHost,
          port: smtpPort,
          username: smtpUsername,
          password: smtpPassword
        };
      }
      else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
}