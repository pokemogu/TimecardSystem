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
      path: '/record',
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
      name: 'apply-record',
      component: () => import('@/views/ApplyRecordView.vue'),
      meta: { title: `${appName} - 打刻申請` }
    },
    {
      path: '/apply/leave',
      name: 'apply-leave',
      component: () => import('@/views/ApplyLeaveView.vue'),
      meta: { title: `${appName} - 休暇申請` }
    },
    {
      path: '/apply/generic-time-period/:type',
      name: 'apply-generic-time-period',
      component: () => import('@/views/ApplyGenericTimePeriodView.vue'),
      meta: { title: `${appName} - 申請` }
    },
    {
      path: '/apply/makeup-leave',
      name: 'apply-makeup-leave',
      component: () => import('@/views/ApplyMakeupLeaveView.vue'),
      meta: { title: `${appName} - 代休申請` }
    },
    {
      path: '/approval/pending',
      name: 'approval-pending',
      component: () => import('@/views/ApproveView.vue'),
      meta: { title: `${appName} - 承認一覧画面` }
    },
    {
      path: '/admin/reguser',
      name: 'reguser',
      component: () => import('@/views/RegisterUserView.vue'),
      meta: { title: `${appName} - 従業員登録` }
    }
  ]
});

router.afterEach((to, from) => {
  nextTick(() => {
    document.title = to.meta.title as string || '勤怠管理システム';
  });
});

export default router;
