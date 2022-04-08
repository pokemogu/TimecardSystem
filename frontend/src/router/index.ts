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
      path: '/work-pattern',
      name: 'work-pattern',
      component: () => import('@/views/WorkPatternCalendarView.vue'),
      meta: { title: `${appName} - 勤務体系登録` },
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
    // 打刻申請
    {
      path: '/apply/record',
      name: 'apply-record',
      component: () => import('@/views/ApplyRecordView.vue'),
      meta: { title: `${appName} - 打刻申請` }
    },
    {
      path: '/apply/record/:id',
      name: 'apply-record-view',
      component: () => import('@/views/ApplyRecordView.vue'),
      meta: { title: `${appName} - 打刻申請` }
    },
    // 休暇申請
    {
      path: '/apply/leave',
      name: 'apply-leave',
      component: () => import('@/views/ApplyLeaveView.vue'),
      meta: { title: `${appName} - 休暇申請` }
    },
    {
      path: '/apply/leave/:id',
      name: 'apply-leave-view',
      component: () => import('@/views/ApplyLeaveView.vue'),
      meta: { title: `${appName} - 休暇申請` }
    },
    // 早出・残業申請
    {
      path: '/apply/overtime',
      name: 'apply-overtime',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period', params: { type: 'overtime' } }
      }
    },
    {
      path: '/apply/overtime/:id',
      name: 'apply-overtime-view',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period-view', params: { type: 'overtime', id: to.params.id } }
      }
    },
    // 遅刻申請
    {
      path: '/apply/lateness',
      name: 'apply-lateness',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period', params: { type: 'lateness' } }
      }
    },
    {
      path: '/apply/lateness/:id',
      name: 'apply-lateness-view',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period-view', params: { type: 'lateness', id: to.params.id } }
      }
    },
    // 早退申請
    {
      path: '/apply/leave-early',
      name: 'apply-leave-early',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period', params: { type: 'leave-early' } }
      }
    },
    {
      path: '/apply/leave-early/:id',
      name: 'apply-leave-early-view',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period-view', params: { type: 'leave-early', id: to.params.id } }
      }
    },
    // 外出申請
    {
      path: '/apply/break',
      name: 'apply-break',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period', params: { type: 'break' } }
      }
    },
    {
      path: '/apply/break/:id',
      name: 'apply-break-view',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period-view', params: { type: 'break', id: to.params.id } }
      }
    },
    // 休日出勤申請
    {
      path: '/apply/holiday-work',
      name: 'apply-holiday-work',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period', params: { type: 'holiday-work' } }
      }
    },
    {
      path: '/apply/holiday-work/:id',
      name: 'apply-holiday-work-view',
      component: () => { },
      redirect: to => {
        return { name: 'apply-generic-time-period-view', params: { type: 'holiday-work', id: to.params.id } }
      }
    },
    // 汎用申請
    {
      path: '/apply/generic-time-period/:type',
      name: 'apply-generic-time-period',
      component: () => import('@/views/ApplyGenericTimePeriodView.vue'),
      meta: { title: `${appName} - 申請` }
    },
    {
      path: '/apply/generic-time-period/:type/:id',
      name: 'apply-generic-time-period-view',
      component: () => import('@/views/ApplyGenericTimePeriodView.vue'),
      meta: { title: `${appName} - 申請` }
    },
    // 代休申請
    {
      path: '/apply/makeup-leave',
      name: 'apply-makeup-leave',
      component: () => import('@/views/ApplyMakeupLeaveView.vue'),
      meta: { title: `${appName} - 代休申請` }
    },
    {
      path: '/apply/makeup-leave/:id',
      name: 'apply-makeup-leave-view',
      component: () => import('@/views/ApplyMakeupLeaveView.vue'),
      meta: { title: `${appName} - 代休申請` }
    },
    // その他申請
    {
      path: '/apply/custom',
      name: 'apply-custom',
      component: () => import('@/views/ApplyCustomView.vue'),
      meta: { title: `${appName} - その他申請` },
    },
    {
      path: '/apply/:type/:id',
      name: 'apply-custom-view',
      component: () => import('@/views/ApplyCustomView.vue'),
      meta: { title: `${appName} - その他申請` }
    },
    // 承認関連
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
      path: '/admin/custom-apply',
      name: 'admin-custom-apply',
      component: () => import('@/views/CustomApplyView.vue'),
      meta: { title: `${appName} - その他申請種別の設定` },
    },
    {
      path: '/admin/device',
      name: 'admin-device',
      component: () => import('@/views/DeviceView.vue'),
      meta: { title: `${appName} - 打刻端末設定` },
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
