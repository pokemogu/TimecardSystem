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
      component: () => { },
      beforeEnter: async (to, from) => {
        const store = useSessionStore();
        await store.logout();
        return { name: 'home' };
      }
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
      path: '/admin/user/:account',
      name: 'admin-user',
      component: () => import('@/views/UserView.vue'),
      meta: { title: `${appName} - 従業員照会` }
    },
    {
      path: '/admin/user',
      name: 'admin-reguser',
      component: () => import('@/views/UserView.vue'),
      meta: { title: `${appName} - 従業員登録` }
    },
    {
      path: '/admin/users',
      name: 'admin-user',
      component: () => import('@/views/IssueQrCodeView.vue'),
      meta: { title: `${appName} - 従業員照会(QRコード)` }
    },
    {
      path: '/admin/route',
      name: 'admin-route',
      component: () => import('@/views/ApprovalRouteView.vue'),
      meta: { title: `${appName} - 承認ルート設定` }
    },
    {
      path: '/admin/workpattern',
      name: 'admin-workpattern',
      component: () => import('@/views/WorkPatternView.vue'),
      meta: { title: `${appName} - 勤務体系設定` }
    },
    {
      path: '/admin/privilege',
      name: 'admin-privilege',
      component: () => import('@/views/PrivilegeView.vue'),
      meta: { title: `${appName} - 権限設定` },
    },
    {
      path: '/admin/holiday',
      name: 'admin-holiday',
      component: () => import('@/views/HolidayView.vue'),
      meta: { title: `${appName} - 休日設定` },
    },
    {
      path: '/approval/:id',
      name: 'approval',
      component: () => import('@/views/PrivilegeView.vue'),
      //meta: { title: `${appName} - 権限設定` },
      redirect: to => {
        return { name: 'apply-leave', params: { id: to.params.id } }
      }
    }
  ]
});

router.beforeEach(async (to, from) => {
  const store = useSessionStore();

  // ログインしていてホーム画面に行こうとした場合はメニュー画面にリダイレクトする
  if (to.name === 'home' && store.isLoggedIn()) {
    try {
      // リフレッシュトークンが有効かどうか、サーバーに問い合わせる
      const token = await store.getToken();
      return { name: 'dashboard' };
    }
    catch (error) {
      // リフレッシュトークンが有効でないので、ログアウトする。
      await store.logout();
      return { name: 'home', params: { status: 'forcedLogout' } };
    }
  }

  // ログインしていない場合はホーム画面にリダイレクトする
  if (to.name !== 'home' && to.name !== 'record') {
    if (!store.isLoggedIn()) {
      //return { name: 'home' };
      return { name: 'home', params: { redirect: to.path } };
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
