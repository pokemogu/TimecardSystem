import { defineStore } from 'pinia';
import * as backendAccess from '@/BackendAccess';

export const useSessionStore = defineStore({
  id: 'timecard-system-session',
  state: () => ({
    //accessTokenData: '',
    refreshToken: '',
    userId: '',
    userName: ''
  }),
  getters: {
    token: (state) => state.refreshToken
  },
  actions: {
    clear() {
      this.refreshToken = '';
      this.userId = '';
      this.userName = '';
    },
    async login(userId: string, userPassword: string) {
      try {
        const result = await backendAccess.login(userId, userPassword);
        if (result.refreshToken && result.userName) {
          this.refreshToken = result.refreshToken;
          this.userId = userId;
          this.userName = result.userName;
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
    async getToken() {
      try {
        return await backendAccess.getToken(this.refreshToken);
      } catch (error) {
        console.log(error);
      }
    },
    async logout() {
      try {
        await backendAccess.logout(this.userId, this.refreshToken);
        this.clear();
      } catch (error) {
        console.log(error);
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