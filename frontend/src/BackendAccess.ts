import axios from 'axios';
import type * as apiif from 'shared/APIInterfaces';

const urlPrefix = import.meta.env.VITE_API_BASEURL ?? '';
const timeout = import.meta.env.VITE_API_TIMEOUT ?? 5000;

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
  } catch (axiosError) {
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
}

export async function logout(account: string, refreshToken: string) {
  try {
    await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/token/revoke`, <apiif.RevokeTokenRequestBody>{
      account: account,
      refreshToken: refreshToken
    }, { timeout: timeout });
  } catch (axiosError) {
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
    } catch (axiosError) {
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
          headers: { 'Authorization': `Bearer ${this.accessToken}`, timeout: timeout },
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
    } catch (axiosError) {
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
  }

  public async record(recordType: string, timestamp: Date, deviceName?: string, deviceRefreshToken?: string) {
    try {
      return (await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/record/${recordType}`,
        <apiif.RecordRequestBody>{ timestamp: timestamp.toISOString(), device: deviceName, deviceToken: deviceRefreshToken },
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (axiosError) {
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
  }

  public async apply(applyType: string, params: {
    targetUserId?: string,
    timestamp: Date,
    dateFrom: Date,
    dateTo?: Date,
    dateRelated?: Date,
    options?: {
      name: string,
      value: string
    }[],
    reason?: string,
    contact?: string
  }) {
    try {
      return (await axios.post<apiif.MessageOnlyResponseBody>(`${urlPrefix}/api/apply/${applyType}`,
        <apiif.ApplyRequestBody>{
          targetUserAccount: params.targetUserId,
          timestamp: params.timestamp.toISOString(),
          dateFrom: params.dateFrom.toISOString(),
          dateTo: params.dateTo ? params.dateTo.toISOString() : undefined,
          dateRelated: params.dateRelated ? params.dateRelated.toISOString() : undefined,
          options: params.options,
          reason: params.reason,
          contact: params.contact
        },
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (axiosError) {
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
  }

  public async getApplies(isUnapproved: boolean, isApproved: boolean, isRejected: boolean) {
    try {
      const filter = isUnapproved ? 'unapproved' : (isApproved ? 'approved' : (isRejected ? 'rejected' : undefined));
      return (await axios.get<apiif.ApplyResponseBody>(`${urlPrefix}/api/apply` + (filter ? `?filter=${filter}` : ''),
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (axiosError) {
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
  }

  public async issueRefreshTokenForOtherUser(account: string) {
    try {
      return (await axios.post<apiif.IssueTokenResponseBody>(`${urlPrefix}/api/token/issue/${account}`,
        {},
        { headers: { 'Authorization': `Bearer ${this.accessToken}` }, timeout: timeout }
      )).data;
    } catch (axiosError) {
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
  }
}

export async function getToken(refreshToken: string) {
  try {
    return (await axios.post<apiif.AccessTokenResponseBody>(`${urlPrefix}/api/token/refresh`, {
      refreshToken: refreshToken
    }, { timeout: timeout })).data;
  }
  catch (axiosError) {
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

export async function getDepartments() {
  const response = await axios.get<{
    departments: {
      name: string
      sections?: {
        name: string
      }[]
    }[]
  }>(`${urlPrefix}/api/department`, { timeout: timeout });

  if (response.status === 200) {
    return response.data.departments;
  }
  else {
    return undefined;
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
  } catch (axiosError) {
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
}


export async function getUserAccountCandidates() {
  try {
    return (await axios.get<apiif.UserAccountCandidatesResponseBody>(`${urlPrefix}/api/user/account-candidates`, { timeout: timeout })).data.candidates;
  } catch (axiosError) {
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
}
