import { createRouter, createWebHashHistory } from 'vue-router';
import { nextTick } from 'vue';

import { useSessionStore } from '@/stores/session';

const appName = '勤怠管理システム';

const router = createRouter({
  //history: createWebHistory(import.meta.env.BASE_URL),
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: `${appName} - ログイン` }
    },
    {
      path: '/record',
      name: 'record',
      component: () => import('@/views/RecordView.vue'),
      meta: { title: `${appName} - 打刻` },
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/DashboardView.vue'),
      meta: { title: `${appName} - 管理` }
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
      name: 'admin-reguser',
      component: () => import('@/views/RegisterUserView.vue'),
      meta: { title: `${appName} - 従業員登録` }
    }
  ]
});

router.beforeEach(async (to, from) => {
  const store = useSessionStore();

  // ログインしていない場合はホーム画面にリダイレクトする
  if (to.name !== 'home' && to.name !== 'record') {
    if (!store.isLoggedIn()) {
      return { name: 'home' };
    } else {
      try {
        // リフレッシュトークンが有効かどうか、サーバーに問い合わせる
        const token = await store.getToken();
      }
      catch (error) {
        // リフレッシュトークンが有効でないので、ログアウトする。
        await store.logout();
        return { name: 'home', params: { status: 'forcedLogout' } };
      }
    }
  }
});

router.afterEach((to, from) => {
  nextTick(() => {
    document.title = to.meta.title as string || '勤怠管理システム';
  });
});

export default router;
