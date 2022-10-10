import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import type * as apiif from 'shared/APIInterfaces';
import createAuthRefreshInterceptor from 'axios-auth-refresh';

// サーバーからのレスポンスJSONにISO日付形式の文字列がある場合は自動的にDate型に変換する
const reISO = /^(?:[+-]\d{6}|\d{4})-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
function isoDateStringToDate(key: any, value: any) {
  if (typeof value === 'string') {
    if ((value.length === 24 || value.length === 27) && value.charAt(value.length - 1) === 'Z') {
      if (reISO.exec(value)) {
        return new Date(value);
      }
    }
  }
  return value;
}

const axiosConfig: AxiosRequestConfig = {
  baseURL: import.meta.env.VITE_API_BASEURL ?? undefined,
  timeout: import.meta.env.VITE_API_TIMEOUT ?? undefined,
  transformResponse: function (data) { return JSON.parse(data, isoDateStringToDate); }
}

function handleAxiosError(axiosError: unknown) {
  console.error(axiosError);
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
    return (await axios.post<apiif.IssueTokenResponseData>('/api/token/issue', <apiif.IssueTokenRequestBody>{
      account: account,
      password: password
    }, axiosConfig)).data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function logout(account: string, refreshToken: string) {
  try {
    await axios.post('/api/token/revoke', <apiif.RevokeTokenRequestBody>{
      account: account,
      refreshToken: refreshToken
    }, axiosConfig);
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getToken(refreshToken: string) {
  try {
    const data = (await axios.post<apiif.AccessTokenResponseData>('/api/token/refresh', {
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
        // AxiosによってオブジェクトがJSON文字列に変換済みの場合は
        // 再送時に二重にJSON文字列に変換しようとしてエラーとなるので、
        // JSON文字列から元のオブジェクトに戻す
        if (failedRequest?.response?.config?.data) {
          try {
            failedRequest.response.config.data = JSON.parse(failedRequest.response.config.data);
          }
          catch (error) { }
        }

        // アクセストークンを再取得する
        const newAccessToken = await getToken(this.refreshToken);
        if (newAccessToken?.accessToken) {
          this.accessToken = newAccessToken.accessToken;

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

  public async getUserAccountCandidates() {
    try {
      return (await this.axios.get<apiif.UserAccountCandidatesResponseBody>('/api/user/account-candidates')).data.candidates;
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

  public async disableUser(account: string) {
    try {
      await this.axios.delete(`/api/user/disable/${account}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async enableUser(account: string) {
    try {
      await this.axios.put(`/api/user/enable/${account}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getUserInfo(account: string) {
    try {
      return (await this.axios.get<apiif.UserInfoResponseData>(`/api/user/${account}`)).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getUsersInfo(params: apiif.UserInfoRequestQuery) {
    try {
      return (await this.axios.get<apiif.UserInfoResponseData[]>('/api/user', { params: { json: JSON.stringify(params) } })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async record(recordType: string, timestamp: Date, deviceAccount?: string, deviceRefreshToken?: string) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>(`/api/record/${recordType}`,
        <apiif.RecordRequestBody>{ timestamp: timestamp, deviceAccount: deviceAccount, deviceToken: deviceRefreshToken }
      );
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async submitRecord(recordType: string, params: apiif.RecordRequestBody) {
    try {
      await this.axios.post<apiif.MessageOnlyResponseBody>(`/api/record/${recordType}`, params);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getRecords(params: apiif.RecordRequestQuery) {
    try {
      return (await this.axios.get<apiif.RecordResponseData[]>('/api/record', { params: { json: JSON.stringify(params) } })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getRecordAndApplyList(params: apiif.RecordRequestQuery) {
    try {
      return (await this.axios.get<apiif.RecordAndApplyResponseData[]>('/api/record', { params: { json: JSON.stringify(params), getApplies: true } })).data;
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

  public async getApplies(params: apiif.ApplyRequestQuery) {
    try {
      return (await this.axios.get<apiif.ApplyResponseData[]>('/api/apply', { params: { json: JSON.stringify(params) } })).data;
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

  public async getApplyCurrentApprovingUsers(applyId: number) {
    try {
      return (await this.axios.get<apiif.UserInfoResponseData[]>(`/api/approve/${applyId}`, {})).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async issueRefreshTokenForOtherUser(account: string) {
    try {
      return (await this.axios.post<apiif.IssueTokenResponseData>(`/api/token/issue/${account}`, {})).data;
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
      const data = (await this.axios.post('/api/privilage', privilege)).data;
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
      const result = (await this.axios.get<apiif.PrivilegeResponseData[]>(`/api/privilage/${account}`)).data;
      if (result && result.length > 0) {
        return result[0];
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
      const data = (await this.axios.get<apiif.PrivilegeResponseData[]>('/api/privilage', {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;

      return data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updatePrivilege(privilege: apiif.PrivilageRequestData) {
    try {
      await this.axios.put('/api/privilage', privilege);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deletePrivilege(id: number) {
    try {
      await this.axios.delete(`/api/privilage/${id}`);
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
      const data = (await this.axios.get<apiif.ApprovalRouteResponseData[]>(`/api/apply/route/${routeName}`)).data;

      if (data.length === 1) {
        return data[0];
      }

      throw new Error('invalid null or more than one response');
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApprovalRoutes(params?: { limit?: number, offset?: number }) {
    try {
      return (await this.axios.get<apiif.ApprovalRouteResponseData[]>('/api/apply/route', {
        params: {
          limit: params ? params.limit : undefined,
          offset: params ? params.offset : undefined
        }
      })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async updateApprovalRoutes(route: apiif.ApprovalRouteRequestData) {
    try {
      const data = (await this.axios.put('/api/apply/route', route)).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteApprovalRoute(id: number) {
    try {
      const data = (await this.axios.delete(`/api/apply/route/${id}`)).data;
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
  public async setHolidays(holidays: apiif.HolidayRequestData[]) {
    try {
      await this.axios.post('/api/holiday', holidays);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteHoliday(date: string) {
    try {
      await this.axios.delete(`/api/holiday/${date}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 有給情報関連
  ///////////////////////////////////////////////////////////////////////
  public async setAnnualLeaves(annualLeaves: apiif.AnnualLeaveRequestData[]) {
    try {
      await this.axios.post('/api/leave', annualLeaves);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getAnnualLeaves(params?: { account: string }) {
    try {
      const data = (await this.axios.get<apiif.AnnualLeaveResponseData[]>('/api/leave', {
        params: params
      })).data;
      return data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteAnnualLeave(id: number) {
    try {
      await this.axios.delete(`/api/leave/${id}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 統計情報関連
  ///////////////////////////////////////////////////////////////////////

  public async getTotalScheduledAnnualLeaves(params?: apiif.TotalScheduledAnnualLeavesQuery) {
    try {
      const data = (await this.axios.get<apiif.TotalScheduledAnnualLeavesResponseData[]>('/api/statistic/leave', {
        params: params
      })).data;
      return data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getTotalWorkTimeInfo(params?: apiif.TotalWorkTimeInfoRequestQuery) {
    try {
      const data = (await this.axios.get<apiif.TotalWorkTimeInfoResponseData[]>('/api/statistic/work', {
        params: params
      })).data;
      return data;
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
      await this.axios.post('/api/device', device);
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
      await this.axios.put('/api/device', device);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteDevice(account: string) {
    try {
      await this.axios.delete(`/api/device/${account}`);
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // メール関連
  ///////////////////////////////////////////////////////////////////////
  public async sendApplyMail(applyId: number, url: string) {
    try {
      await this.axios.post(`/api/mail/apply/${applyId}`, { url: url });
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async sendApplyRejectedMail(applyId: number, url: string) {
    try {
      await this.axios.post(`/api/mail/reject/${applyId}`, { url: url });
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async sendApplyApprovedMail(applyId: number, url: string) {
    try {
      await this.axios.post(`/api/mail/approve/${applyId}`, { url: url });
    } catch (error) {
      handleAxiosError(error);
    }
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

export async function getHolidays(params: apiif.HolidayRequestQuery) {
  try {
    const result = (await axios.get<apiif.HolidaysResponseBody>('/api/holiday', { ...axiosConfig, params: params })).data;
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