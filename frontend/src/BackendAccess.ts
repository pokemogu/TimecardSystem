import axios from 'axios';
import type * as apiif from 'shared/APIInterfaces';

const urlPrefix = import.meta.env.VITE_API_BASEURL ?? '';

export async function login(account: string, password: string) {
  try {
    const data = (await axios.post<apiif.IssueTokenResponseBody>('/api/token/issue', <apiif.IssueTokenRequestBody>{
      account: account,
      password: password
    })).data;

    console.log(data);
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
    await axios.post<apiif.MessageOnlyResponseBody>('/api/token/revoke', <apiif.RevokeTokenRequestBody>{
      account: account,
      refreshToken: refreshToken
    });
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
      const result = (await axios.get<apiif.UserInfoResponseBody>(`${urlPrefix}/api/user/${account}`, { headers: { 'Authorization': `Bearer ${this.accessToken}` } })).data;
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

  public async record(recordType: string, timestamp: Date) {
    try {
      return (await axios.post<{
        message: string,
      }>(`${urlPrefix}/api/record/${recordType}`,
        { timestamp: timestamp.toISOString() },
        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
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
        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
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
        { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
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
    return (await axios.post<{
      message: string,
      userId: string,
      accessToken: string
    }>(`${urlPrefix}/api/token/refresh`, {
      refreshToken: refreshToken
    })).data;
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
  }>(`${urlPrefix}/api/devices`);

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
  }>(`${urlPrefix}/api/department`);

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
    }>(`${urlPrefix}/api/options/apply/${applyType}`)).data;
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
