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
      }>(`/api/user/${userId}`, { headers: { 'Authorization': `Bearer ${this.accessToken}` } })).data;
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
  const response = await axios.post<{
    message: string,
    accessToken: string
  }>(`${urlPrefix}/api/token/refresh`, {
    refreshToken: refreshToken
  });

  if (response.status === 200 && response.data?.accessToken) {
    return response.data.accessToken;
  }
  else {
    return undefined;
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
