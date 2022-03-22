import { defineStore } from 'pinia';
import * as backendAccess from '@/BackendAccess';

export const useSessionStore = defineStore({
  id: 'timecard-system-session',
  state: () => ({
    //accessTokenData: '',
    refreshToken: '',
    userAccount: '',
    userName: ''
  }),
  getters: {
    token: (state) => state.refreshToken
  },
  actions: {
    clear() {
      this.refreshToken = '';
      this.userAccount = '';
      this.userName = '';
    },
    async login(account: string, password: string) {
      try {
        const result = await backendAccess.login(account, password);
        if (result.refreshToken && result.name) {
          this.refreshToken = result.refreshToken;
          this.userAccount = account;
          this.userName = result.name;
          return true;
        }
        else {
          return false;
        }
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    async getToken(refreshToken: string | null = null) {
      try {
        if (refreshToken) {
          this.refreshToken = refreshToken;
        }
        const result = await backendAccess.getToken(this.refreshToken);
        return result;
      } catch (error) {
        console.log(error);
        throw error;
      }
    },
    async logout() {
      try {
        await backendAccess.logout(this.userAccount, this.refreshToken);
        this.clear();
      } catch (error) {
        this.clear();
        console.log(error);
        throw error;
      }
    },
    isLoggedIn() {
      return (this.refreshToken !== '');
    }
  },
  persist: {
    enabled: true
  }
});