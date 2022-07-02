import { defineStore } from 'pinia';
import Cookies from 'js-cookie'

import * as backendAccess from '@/BackendAccess';
import type * as apiif from 'shared/APIInterfaces';

const TIMECARD_SYSTEM_SESSION = 'timecard-system-session'

const cookiesStorage: Storage = {
  setItem(key, state) {
    Cookies.set(`${TIMECARD_SYSTEM_SESSION}-${key}`, state);
  },
  getItem(key) {
    return Cookies.get(`${TIMECARD_SYSTEM_SESSION}-${key}`) ?? null;
  },
  get ['length']() {
    const allCookies = Cookies.get();
    let sessionCookieNum = 0;
    for (const key in allCookies) {
      sessionCookieNum += (key.indexOf(`${TIMECARD_SYSTEM_SESSION}-`) === 0) ? 1 : 0;
    }
    return sessionCookieNum;
  },
  clear() {
    const allCookies = Cookies.get();
    for (const key in allCookies) {
      if (key.indexOf(`${TIMECARD_SYSTEM_SESSION}-`) === 0) {
        Cookies.remove(key);
      }
    }
  },
  key(index) {
    return Object.keys(Cookies.get())[index];
  },
  removeItem(key) {
    Cookies.remove(`${TIMECARD_SYSTEM_SESSION}-${key}`);
  }
}

export const useSessionStore = defineStore({
  id: TIMECARD_SYSTEM_SESSION,
  state: () => ({
    accessToken: '',
    refreshToken: '',
    userAccount: '',
    userName: '',
    userDepartment: '',
    userSection: '',
    privilege: <apiif.PrivilegeResponseData | null>null,
    lastApplyListViewTab: <string | null>null
  }),
  getters: {
    token: (state) => state.refreshToken
  },
  actions: {
    clear() {
      this.accessToken = '';
      this.refreshToken = '';
      this.userAccount = '';
      this.userName = '';
      this.userAccount = '';
      this.userDepartment = '';
      this.userSection = '';
      this.privilege = null;
      this.lastApplyListViewTab = null;
    },
    async login(account: string, password: string) {
      try {
        const result = await backendAccess.login(account, password);
        if (result?.refreshToken && result?.name) {
          this.refreshToken = result.refreshToken;
          this.userAccount = account;
          this.userName = result.name;
          this.userSection = result.section;
          this.userDepartment = result.department;

          this.accessToken = await this.getToken();
          const access = new backendAccess.TokenAccess(this.accessToken);
          const privilege = await access.getUserPrivilege(this.userAccount);
          if (privilege) {
            this.privilege = privilege;
          }
          return true;
        }
        else {
          return false;
        }
      } catch (error) {
        const err = error as Error;
        if (err.name === '401') {
          return false;
        }
        else {
          throw error;
        }
      }
    },
    async getToken(refreshToken?: string) {
      try {
        if (refreshToken) {
          this.refreshToken = refreshToken;
        }
        const result = await backendAccess.getToken(this.refreshToken);
        if (!result?.accessToken) {
          throw new Error('token not returned');
        }
        return result.accessToken;
      } catch (error) {
        console.error(error);
        throw error;
      }
    },
    async callbackAccessTokenRefresh(newAccessToken: string) {
      this.accessToken = newAccessToken;
    },
    async getTokenAccess() {
      if (this.refreshToken === '') {
        throw new Error('リフレッシュトークンが取得されていません。ログインしてください。');
      }
      if (this.accessToken === '') {
        this.accessToken = await this.getToken();
      }
      return new backendAccess.TokenAccess(this.accessToken, this.refreshToken, this.callbackAccessTokenRefresh);
    },
    async logout() {
      try {
        await backendAccess.logout(this.userAccount, this.refreshToken);
        this.clear();
      } catch (error) {
        this.clear();
        console.error(error);
        throw error;
      }
    },
    isLoggedIn() {
      return (this.refreshToken !== '');
    }
  },
  persist: {
    enabled: true,
    //strategies: [{ storage: localStorage }]
    strategies: [{ storage: cookiesStorage }]
  }
});