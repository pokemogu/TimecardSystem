import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { nextTick, provide, inject } from 'vue';

import type { TimecardSession } from '../timecard-session-interface';

const appName = '勤怠管理システム';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: `${appName} - ログイン` }
    },
    {
      path: '/record/:method',
      name: 'record',
      component: () => import('@/views/RecordView.vue'),
      meta: { title: `${appName} - 打刻` }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: `${appName} - 管理` }
    },
    {
      path: '/auth',
      name: 'auth',
      component: function () {

      }
    },
    {
      path: '/logout',
      name: 'logout',
      component: () => import('@/views/Logout.vue')
    },
    {
      path: '/apply/record',
      name: 'apply',
      component: () => import('@/views/ApplyRecordView.vue'),
      meta: { title: `${appName} - 打刻申請` }
    }
  ]
});

router.afterEach((to, from) => {
  nextTick(() => {
    document.title = to.meta.title as string || '勤怠管理システム';
  });
});

export default router;
