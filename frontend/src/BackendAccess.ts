import axios from 'axios';
import type * as apiif from 'shared/APIInterfaces';

const urlPrefix = import.meta.env.VITE_API_BASEURL ?? '';
const timeout = import.meta.env.VITE_API_TIMEOUT ?? 5000;

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
    const data = (await axios.post<apiif.IssueTokenResponseBody>(`${urlPrefix}/api/token/issue`, <apiif.IssueTokenRequestBody>{
      account: account,
      password: password
    }, { timeout: timeout })).data;

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
    await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/token/revoke`, <apiif.RevokeTokenRequestBody>{
      account: account,
      refreshToken: refreshToken
    }, { timeout: timeout });
  } catch (error) {
    handleAxiosError(error);
  }
}

export async function getToken(refreshToken: string) {
  try {
    const data = (await axios.post<apiif.AccessTokenResponseBody>(`${urlPrefix}/api/token/refresh`, {
      refreshToken: refreshToken
    }, { timeout: timeout })).data;
    return data;
  } catch (error) {
    handleAxiosError(error);
  }
}

export class TokenAccess {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
  public async getUserInfo(account: string) {
    try {
      const result = (await axios.get<apiif.UserInfoResponseBody>(`${urlPrefix}/api/user/${account}`,
        { headers: { 'Authorization': `Bearer ${this.accessToken}`, timeout: timeout } })).data;
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
    try {
      const result = (await axios.get<apiif.UserInfosResponseBody>(`${urlPrefix}/api/user`,
        {
          headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout,
          params: <apiif.UserInfoRequestQuery>{
            id: params.byId,
            account: params.byAccount,
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

  public async record(recordType: string, timestamp: Date, deviceName?: string, deviceRefreshToken?: string) {
    try {
      return (await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/record/${recordType}`,
        <apiif.RecordRequestBody>{ timestamp: timestamp.toISOString(), device: deviceName, deviceToken: deviceRefreshToken },
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async apply(applyType: string, params: apiif.ApplyRequestBody) {
    try {
      const data = (await axios.post<{ message: string, id: number }>(`${urlPrefix}/api/apply/${applyType}`, params,
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
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

  public async getMyApplies(params?: {
    isUnapproved?: boolean,
    isApproved?: boolean,
    isRejected?: boolean
  }
  ) {
    try {
      const filter = params?.isUnapproved ? 'unapproved' : (params?.isApproved ? 'approved' : (params?.isRejected ? 'rejected' : undefined));
      return (await axios.get<apiif.ApplyResponseBody>(`${urlPrefix}/api/apply` + (filter ? `?filter=${filter}` : ''),
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async issueRefreshTokenForOtherUser(account: string) {
    try {
      return (await axios.post<apiif.IssueTokenResponseBody>(`${urlPrefix}/api/token/issue/${account}`,
        {},
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 承認ルート関連
  ///////////////////////////////////////////////////////////////////////

  public async addApprovalRoutes(route: apiif.ApprovalRouteRequestData) {
    try {
      const data = (await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/apply/route`, route, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        timeout: timeout
      })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getApprovalRoute(routeName: string) {
    try {
      const data = (await axios.get<apiif.ApprovalRouteResponseBody>(`${urlPrefix}/api/apply/route/${routeName}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        timeout: timeout
      })).data;

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
      const data = (await axios.get<apiif.ApprovalRouteResponseBody>(`${urlPrefix}/api/apply/route`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        timeout: timeout,
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
      const data = (await axios.put<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/apply/route`, route, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout
      })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteApprovalRoute(id: number) {
    try {
      const data = (await axios.delete<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/apply/route/${id}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout
      })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }

  ///////////////////////////////////////////////////////////////////////
  // 勤務体系関連
  ///////////////////////////////////////////////////////////////////////

  public async addWorkPattern(workPattern: apiif.WorkPatternRequestData) {
    try {
      await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/work-pattern`, workPattern, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout
      });
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async getWorkPatterns(params?: { limit?: number, offset?: number }) {
    try {
      const data = (await axios.get<apiif.WorkPatternsResponseBody>(`${urlPrefix}/api/work-pattern`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        timeout: timeout,
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
      const data = (await axios.get<apiif.WorkPatternResponseBody>(`${urlPrefix}/api/work-pattern/${name}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        timeout: timeout,
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
      await axios.put<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/work-pattern`, workPattern, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout
      });
    } catch (error) {
      handleAxiosError(error);
    }
  }

  public async deleteWorkPattern(id: number) {
    try {
      const data = (await axios.delete<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/work-pattern/${id}`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout
      })).data;
    } catch (error) {
      handleAxiosError(error);
    }
  }
}

export async function getDevices() {
  const response = await axios.get<{
    message: string,
    devices: { name: string }[]
  }>(`${urlPrefix}/api/devices`, { timeout: timeout });

  if (response.status === 200) {
    return response.data.devices;
  }
  else {
    return undefined;
  }
}

export async function getApprovalRouteRoles() {
  try {
    const data = (await axios.get<apiif.ApprovalRouteRoleBody>(`${urlPrefix}/api/apply/role`, { timeout: timeout })).data;
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
    }>(`${urlPrefix}/api/department`, { timeout: timeout });

    return response.data.departments;
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
    }>(`${urlPrefix}/api/options/apply/${applyType}`, { timeout: timeout })).data;
  } catch (error) {
    handleAxiosError(error);
  }
}


export async function getUserAccountCandidates() {
  try {
    return (await axios.get<apiif.UserAccountCandidatesResponseBody>(`${urlPrefix}/api/user/account-candidates`, { timeout: timeout })).data.candidates;
  } catch (error) {
    handleAxiosError(error);
  }
}
