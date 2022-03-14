import axios from 'axios';
import { acceptHMRUpdate } from 'pinia';

const urlPrefix = import.meta.env.VITE_API_BASEURL ?? '';

export async function login(userId: string, userPassword: string) {
  const response = await axios.post<{
    refreshToken?: string,
    message: string,
    userId?: string,
    userName?: string
  }>('/api/token/issue', {
    userId: userId,
    userPassword: userPassword
  });

  if (response.status !== 200) {
    const error = new Error(response.data.message);
    error.name = response.status.toString();
    throw error;
  }

  return {
    refreshToken: response.data.refreshToken,
    userName: response.data.userName
  };
}

export async function logout(userId: string, refreshToken: string) {
  try {
    await axios.post<{
      message: string,
    }>('/api/token/revoke', {
      userId: userId,
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
  }
}

export class TokenAccess {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
  public async getUserInfo(userId: string) {
    try {
      return (await axios.get<{
        message: string,
        id: string,
        name: string,
        phonetic: string,
        email: string,
        section?: string,
        department?: string
      }>(`${urlPrefix}/api/user/${userId}`, { headers: { 'Authorization': `Bearer ${this.accessToken}` } })).data;
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError)) {
        const error = new Error();
        if (axiosError.response) {
          error.name = axiosError.response.status.toString();
          error.message = (axiosError.response?.data as { message: string }).message;
        }
        throw error;
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
  }
}
