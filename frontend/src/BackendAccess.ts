import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type * as apiif from 'shared/APIInterfaces';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

const axiosConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_BASEURL ?? '',
  timeout: import.meta.env.VITE_API_TIMEOUT ?? 60000
}

const urlPrefix = import.meta.env.VITE_API_BASEURL ?? '';
const timeout = import.meta.env.VITE_API_TIMEOUT ?? 60000;

function handleAxiosError(axiosError: unknown) {
  if (axios.isAxiosError(axiosError)) {
    const error = new Error();
    if (axiosError.response) {
      error.name = axiosError.response.status.toString();
      error.message = (axiosError.response?.data as { message: string }).message;
    }
    throw error;
  }
  else {
    throw axiosError;
  }
}

export async function login(account: string, password: string) {
  try {
    const data = (await axios.post<apiif.IssueTokenResponseBody>('/api/token/issue', <apiif.IssueTokenRequestBody>{
      account: account,
      password: password
    }, axiosConfig)).data;

    if (!data.token) {
      throw new Error('token undefined');
    }
    else {
      return data.token;
    }
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function logout(account: string, refreshToken: string) {
  try {
    await axios.post<apiif.MessageOnlyResponseBody>('/api/token/revoke', <apiif.RevokeTokenRequestBody>{
      account: account,
      refreshToken: refreshToken
    }, axiosConfig);
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getToken(refreshToken: string) {
  try {
    const data = (await axios.post<apiif.AccessTokenResponseBody>('/api/token/refresh', {
      refreshToken: refreshToken
    }, axiosConfig)).data;
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export class TokenAccess {
  accessToken: string;
  refreshToken: string;
  axios: AxiosInstance;
  callbackOnAccessTokenChanged?: (accessToken: string) => void;

  constructor(accessToken: string, refreshToken: string = '', callbackOnAccessTokenChanged?: (accessToken: string) => void) {

    this.axios = axios.create(axiosConfig);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    this.axios.interceptors.request.use(request => {
      request.headers = { 'Authorization': `Bearer ${this.accessToken}` };
      return request;
    });

    if (callbackOnAccessTokenChanged) {
      this.callbackOnAccessTokenChanged = callbackOnAccessTokenChanged;
    }

    // リフレッシュトークンがある場合は自動リトライを行なう
    if (this.refreshToken !== '') {
      createAuthRefreshInterceptor(this.axios, async (failedRequest) => {
        const newAccessToken = await getToken(this.refreshToken);
        if (newAccessToken?.token) {
          this.accessToken = newAccessToken.token.accessToken;

          if (this.callbackOnAccessTokenChanged) {
            this.callbackOnAccessTokenChanged(this.accessToken);
          }

        }
      });
    }
  }

  public async changePassword(params: apiif.ChangePasswordRequestBody) {
    try {
      await this.axios.put<apiif.MessageOnlyResponseBody>('/api/token/password', params);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async addUsers(usersInfo: apiif.UserInfoRequestData[]) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/user', usersInfo);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getUserInfo(account: string) {
    try {
      const result = (await this.axios.get<apiif.UserInfoResponseBody>(`/api/user/${account}`)).data;
      if (!result.info) {
        throw new Error('response data undefined');
      } else {
        return result.info;
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getUserInfos(params: {
    byId?: number,
    isAvailable?: boolean,
    byAccounts?: string[],
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
    try {
      const result = (await this.axios.get<apiif.UserInfosResponseBody>('/api/user',
        {
          params: <apiif.UserInfoRequestQuery>{
            id: params.byId,
            accounts: params.byAccounts,
            name: params.byName,
            phonetic: params.byPhonetic,
            department: params.byDepartment,
            section: params.bySection,
            registeredFrom: params.registeredFrom?.toISOString(),
            registeredTo: params.registeredTo?.toISOString(),
            isQrCodeIssued: params.isQrCodeIssued,
            limit: params.limit,
            offset: params.offset
          }
        })).data;
      if (!result.infos) {
        throw new Error('response data undefined');
      } else {
        return result.infos;
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async record(recordType: string, timestamp: Date, deviceAccount?: string, deviceRefreshToken?: string) {
    try {
      return (await this.axios.post<apiif.MessageOnlyResponseBody>(`/api/record/${recordType}`,
        <apiif.RecordRequestBody>{ timestamp: timestamp.toISOString(), deviceAccount: deviceAccount, deviceToken: deviceRefreshToken }
      )).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getRecords(params: apiif.RecordRequestQuery) {
    try {
      return (await this.axios.get<apiif.RecordResponseBody>('/api/record', { params: params })).data.records;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async submitApply(applyType: string, params: apiif.ApplyRequestBody) {
    try {
      const data = (await this.axios.post<{ message: string, id: number }>(`/api/apply/${applyType}`, params)).data;
      if (data.id) {
        return data.id;
      }
      else {
        throw new Error('invalid response: did not return applyId');
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApply(applyId: number) {
    try {
      const applies = (await this.axios.get<apiif.ApplyResponseBody>(`/api/apply/${applyId}`)).data.applies;
      if (applies && applies.length > 0) {
        return applies[0];
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApplyTypeOfApply(applyId: number) {
    try {
      const types = (await this.axios.get<apiif.ApplyTypeResponseBody>(`/api/apply/applyType/${applyId}`)).data.applyTypes;
      if (types && types.length > 0) {
        return types[0];
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getMyApplies(params?: {
    isUnapproved?: boolean,
    isApproved?: boolean,
    isRejected?: boolean
  }
  ) {
    try {
      const filter = params?.isUnapproved ? 'unapproved' : (params?.isApproved ? 'approved' : (params?.isRejected ? 'rejected' : undefined));
      return (await this.axios.get<apiif.ApplyResponseBody>(`/api/apply` + (filter ? `?filter=${filter}` : ''))).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async approveApply(applyId: number) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>(`/api/approve/${applyId}`, {});
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async rejectApply(applyId: number) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>(`/api/reject/${applyId}`, {});
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async issueRefreshTokenForOtherUser(account: string) {
    try {
      return (await this.axios.post<apiif.IssueTokenResponseBody>(`/api/token/issue/${account}`, {})).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async addApplyType(applyType: apiif.ApplyTypeRequestData) {
    try {
      return (await this.axios.post<{ message: string, id?: number }>('/api/apply-type', applyType)).data.id;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updateApplyType(applyType: apiif.ApplyTypeRequestData) {
    try {
      await this.axios.put<{ message: string, id?: number }>('/api/apply-type', applyType);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteApplyType(name: string) {
    try {
      await this.axios.delete<apiif.MessageOnlyResponseBody>(`/api/apply-type/${name}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 権限関連
  ///////////////////////////////////////////////////////////////////////

  public async addPrivilege(privilege: apiif.PrivilageRequestData) {
    try {
      const data = (await this.axios.post<apiif.MessageOnlyResponseBody>('/api/privilage', privilege)).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  /*
  public async getPrivilege(privilegeName: string) {
    try {
      return (await axios.get<apiif.PrivilegeResponseBody>(`/api/privilage/${privilegeName}`)).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
  */

  public async getUserPrivilege(account: string) {
    try {
      const result = (await this.axios.get<apiif.PrivilegeResponseBody>(`/api/privilage/${account}`)).data;
      if (result?.privileges && result.privileges.length > 0) {
        return result.privileges[0];
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApplyPrivilege(privilegeId: number) {
    try {
      return (await this.axios.get<apiif.ApplyPrivilegeResponseBody>(`/api/apply-privilage/${privilegeId}`)).data.applyPrivileges;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getPrivileges(params?: { limit?: number, offset?: number }) {
    try {
      const data = (await this.axios.get<apiif.PrivilegeResponseBody>('/api/privilage', {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;

      return data.privileges;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updatePrivilege(privilege: apiif.PrivilageRequestData) {
    try {
      await this.axios.put<apiif.MessageOnlyResponseBody>('/api/privilage', privilege);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deletePrivilege(id: number) {
    try {
      await this.axios.delete<apiif.MessageOnlyResponseBody>(`/api/privilage/${id}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 承認ルート関連
  ///////////////////////////////////////////////////////////////////////

  public async addApprovalRoutes(route: apiif.ApprovalRouteRequestData) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/apply/route', route);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApprovalRoute(routeName: string) {
    try {
      const data = (await this.axios.get<apiif.ApprovalRouteResponseBody>(`/api/apply/route/${routeName}`)).data;

      if (data.routes?.length === 1) {
        return data.routes[0];
      }

      throw new Error('invalid null or more than one response');
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApprovalRoutes(params?: { limit?: number, offset?: number }) {
    try {
      const data = (await this.axios.get<apiif.ApprovalRouteResponseBody>('/api/apply/route', {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;
      return data.routes;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updateApprovalRoutes(route: apiif.ApprovalRouteRequestData) {
    try {
      const data = (await this.axios.put<apiif.MessageOnlyResponseBody>('/api/apply/route', route)).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteApprovalRoute(id: number) {
    try {
      const data = (await this.axios.delete<apiif.MessageOnlyResponseBody>(`/api/apply/route/${id}`)).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 勤務体系関連
  ///////////////////////////////////////////////////////////////////////

  public async addWorkPattern(workPattern: apiif.WorkPatternRequestData) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/work-pattern', workPattern);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getWorkPatterns(params?: { limit?: number, offset?: number }) {
    try {
      const data = (await this.axios.get<apiif.WorkPatternsResponseBody>('/api/work-pattern', {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;
      return data.workPatterns;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getWorkPattern(name: string, params?: { limit?: number, offset?: number }) {
    try {
      const data = (await this.axios.get<apiif.WorkPatternResponseBody>(`/api/work-pattern/${name}`, {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;
      return data.workPattern;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updateWorkPattern(workPattern: apiif.WorkPatternRequestData) {
    try {
      await this.axios.put<apiif.MessageOnlyResponseBody>('/api/work-pattern', workPattern);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteWorkPattern(id: number) {
    try {
      await this.axios.delete<apiif.MessageOnlyResponseBody>(`/api/work-pattern/${id}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async setUserWorkPatternCalendar(workPatternCalendar: apiif.UserWorkPatternCalendarRequestData) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/work-pattern-calendar', workPatternCalendar);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getUserWorkPatternCalendar(params?: apiif.UserWorkPatternCalendarRequestQuery) {
    try {
      const data = (await this.axios.get<apiif.UserWorkPatternCalendarResponseBody>('/api/work-pattern-calendar', {
        params: params
      })).data;
      return data.userWorkPatternCalendars;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteUserWorkPatternCalendar(date: string, account?: string) {
    try {
      await this.axios.delete<apiif.MessageOnlyResponseBody>(
        `/api/work-pattern-calendar/${date}` + (account ? `/${account}` : ''));
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 休日情報関連
  ///////////////////////////////////////////////////////////////////////
  public async setHoliday(holiday: apiif.HolidayRequestData) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/holiday', holiday);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteHoliday(date: string) {
    try {
      await this.axios.delete<apiif.MessageOnlyResponseBody>(`/api/holiday/${date}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // システム設定関連
  ///////////////////////////////////////////////////////////////////////
  public async setSystemConfig(key: string, value: string) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/config', { key: key, value: value });
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getSystemConfigValue(key: string) {
    try {
      const data = (await this.axios.get<apiif.SystemConfigResponseBody>(`/api/config/${key}`)).data;
      if (data?.config && data.config.length > 0) {
        return data.config[0].value;
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getSystemConfig(params: apiif.SystemConfigQuery) {
    try {
      const data = (await this.axios.get<apiif.SystemConfigResponseBody>('/api/config', {
        params: params
      })).data;
      if (data?.config) {
        return data.config;
      }
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 機器情報関連
  ///////////////////////////////////////////////////////////////////////
  public async addDevice(device: apiif.DeviceRequestData) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>('/api/device', device);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getDevices(params?: { limit?: number, offset?: number }) {
    try {
      const data = (await this.axios.get<apiif.DevicesResponseBody>('/api/device', {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;
      return data.devices;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updateDevice(device: apiif.DeviceRequestData) {
    try {
      await this.axios.put<apiif.MessageOnlyResponseBody>('/api/device', device);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteDevice(account: string) {
    try {
      await this.axios.delete<apiif.MessageOnlyResponseBody>(`/api/device/${account}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }
}

export async function getDevices() {
  const response = await axios.get<{
    message: string,
    devices: { name: string }[]
  }>(`${urlPrefix}/api/devices`, axiosConfig);

  if (response.status === 200) {
    return response.data.devices;
  }
  else {
    return undefined;
  }
}

export async function getApprovalRouteRoles() {
  try {
    const data = (await axios.get<apiif.ApprovalRouteRoleBody>(`${urlPrefix}/api/apply/role`, axiosConfig)).data;
    return data.roles;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getDepartments() {
  try {
    const response = await axios.get<{
      departments: {
        name: string
        sections?: {
          name: string
        }[]
      }[]
    }>('/api/department', axiosConfig);

    return response.data.departments;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getApplyTypes() {
  try {
    const response = await axios.get<apiif.ApplyTypeResponseBody>('/api/apply-type', axiosConfig);
    return response.data.applyTypes;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getApplyTypeOptions(applyType: string) {
  try {
    return (await axios.get<{
      message: string,
      type?: string,
      optionTypes?: {
        name: string,
        description: string,
        options: {
          name: string,
          description: string
        }[]
      }[]
    }>(`/api/options/apply/${applyType}`, axiosConfig)).data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getUserAccountCandidates() {
  try {
    return (await axios.get<apiif.UserAccountCandidatesResponseBody>('/api/user/account-candidates', axiosConfig)).data.candidates;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getHolidays(params: apiif.HolidayRequestQuery) {
  try {
    const result = (await axios.get<apiif.HolidaysResponseBody>('/api/holiday', { timeout: axiosConfig.timeout, params: params })).data;
    if (result?.holidays) {
      return result.holidays.map((holiday) => {
        const date = new Date(holiday.date);
        const year = date.getFullYear().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return {
          date: `${year}-${month}-${day}`,
          name: holiday.name
        };
      });
    }
  } catch (error) {
    handleAxiosError(error);
  }
}