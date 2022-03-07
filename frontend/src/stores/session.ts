import { defineStore } from 'pinia'
import axios from 'axios';

export const useSessionStore = defineStore({
  id: 'session',
  state: () => ({
    accessTokenData: '',
    refreshTokenData: '',
    userId: '',
    userName: ''
  }),
  getters: {
    token: (state) => state.accessTokenData
  },
  actions: {
    async initTokens(userId: string, userPassword: string) {
      try {
        const responseIssue = await axios.post<{ accessToken?: string, refreshToken?: string, message: string }>('/api/token/issue', {
          userId: userId,
          userPassword: userPassword
        });

        if (responseIssue.status !== 200) {
          return responseIssue.status;
        }

        if (responseIssue.data.accessToken) {
          this.accessTokenData = responseIssue.data.accessToken;
        }
        if (responseIssue.data.refreshToken) {
          this.refreshTokenData = responseIssue.data.refreshToken;
        }
        this.userId = userId;

        return responseIssue.status;
      } catch (error) {
        return 500;
      }
    },
    async refreshToken() {
      try {
        const response = await axios.post<{ accessToken?: string, message: string }>('/api/token/refresh', {
          refreshToken: this.refreshTokenData
        });

        return response.status;
      } catch (error) {
      }
      return 500;
    },
    async revokeToken() {
      try {
        const response = await axios.post<{ message: string }>('/api/token/revoke', {
          refreshToken: this.refreshTokenData
        });

        switch (response.status) {
          case 200:
            this.accessTokenData = '';
            this.refreshTokenData = '';
          default:
            return response.status;
        }
      } catch (error) {
      }
      return 500;
    }
  }
})
