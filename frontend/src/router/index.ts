import { createRouter, createWebHashHistory } from 'vue-router';
import { nextTick } from 'vue';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

const appName = '勤怠管理システム';

// 承認権限が有るかどうかチェックする
const verifyApprove = (redirectTo: string = 'dashboard') => {
  const store = useSessionStore();
  if (!store.privilege) {
    return { name: redirectTo };
  }
  else {
    return store.privilege.approve === true;
  }
}

// 申請権限が有るかどうかチェックする
const verifyApplyPrivilege = (applyType: string, redirectTo: string = 'dashboard') => {
  const store = useSessionStore();
  if (!store.privilege?.applyPrivileges) {
    return { name: redirectTo };
  }
  else {
    const applyPrivilege = store.privilege.applyPrivileges.find(applyPrivilege => applyPrivilege.applyTypeName === applyType);
    if (applyPrivilege && applyPrivilege.permitted === false) {
      return { name: redirectTo };
    }
  }
  return true;
};

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
    {
      path: '/approve/:id',
      name: 'approve',
      component: () => { },
      beforeEnter: async (to, from) => {
        // 指定されたIDの申請の種類を取得して、適切な申請種類のビューにリダイレクトする
        const store = useSessionStore();
        const token = await store.getToken();
        if (token) {
          const access = new backendAccess.TokenAccess(token);
          const applyId = parseInt(to.params.id as string);
          try {
            const type = await access.getApplyTypeOfApply(applyId);
            if (type?.name) {
              return `/apply/${type.name}/${applyId}`;
            }
          }
          catch (error) {
            console.error(error);
          }
        }
        return { name: 'home' };
      }
    },
    // 打刻申請
    {
      path: '/apply/record',
      name: 'apply-record',
      component: () => import('@/views/ApplyRecordView.vue'),
      meta: { title: `${appName} - 打刻申請` },
      beforeEnter: () => { return verifyApplyPrivilege('record') }
    },
    {
      path: '/apply/record/:id',
      name: 'apply-record-view',
      component: () => import('@/views/ApplyRecordView.vue'),
      meta: { title: `${appName} - 打刻申請` },
      beforeEnter: () => { return verifyApprove() || verifyApplyPrivilege('record') }
    },
    // 休暇申請
    {
      path: '/apply/leave',
      name: 'apply-leave',
      component: () => import('@/views/ApplyLeaveView.vue'),
      meta: { title: `${appName} - 休暇申請` },
      beforeEnter: () => { return verifyApplyPrivilege('leave') }
    },
    {
      path: '/apply/leave/:id',
      name: 'apply-leave-view',
      component: () => import('@/views/ApplyLeaveView.vue'),
      meta: { title: `${appName} - 休暇申請` },
      beforeEnter: () => { return verifyApprove() || verifyApplyPrivilege('leave') }
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
      meta: { title: `${appName} - 申請` },
      beforeEnter: (to) => { return verifyApprove() || verifyApplyPrivilege(to.params.type as string) }
    },
    {
      path: '/apply/generic-time-period/:type/:id',
      name: 'apply-generic-time-period-view',
      component: () => import('@/views/ApplyGenericTimePeriodView.vue'),
      meta: { title: `${appName} - 申請` },
      beforeEnter: (to) => { return verifyApprove() || verifyApplyPrivilege(to.params.type as string) }
    },
    // 代休申請
    {
      path: '/apply/makeup-leave',
      name: 'apply-makeup-leave',
      component: () => import('@/views/ApplyMakeupLeaveView.vue'),
      meta: { title: `${appName} - 代休申請` },
      beforeEnter: () => { return verifyApprove() || verifyApplyPrivilege('makeup-leave') }
    },
    {
      path: '/apply/makeup-leave/:id',
      name: 'apply-makeup-leave-view',
      component: () => import('@/views/ApplyMakeupLeaveView.vue'),
      meta: { title: `${appName} - 代休申請` },
      beforeEnter: () => { return verifyApprove() || verifyApplyPrivilege('makeup-leave') }
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
    // 申請一覧
    {
      path: '/apply/list',
      name: 'apply-list',
      component: () => import('@/views/ApplyListView.vue'),
      meta: { title: `${appName} - 申請一覧` }
    },
    // 承認関連
    {
      path: '/approval/list',
      name: 'approval-list',
      component: () => import('@/views/ApplyListView.vue'),
      meta: { title: `${appName} - 承認一覧` },
      beforeEnter: () => { return verifyApprove() }
    },
    // 管理関連
    {
      path: '/admin/user/:account',
      name: 'admin-user',
      component: () => import('@/views/OldUserView.vue'),
      meta: { title: `${appName} - 従業員照会` }
    },
    {
      path: '/view/record',
      name: 'view-record',
      component: () => { },
      meta: { title: `${appName} - 未打刻一覧` }
    },
    {
      path: '/view/leave',
      name: 'view-leave',
      component: () => { },
      meta: { title: `${appName} - 有給取得状況` }
    },
    {
      path: '/view/overtime',
      name: 'view-overtime',
      component: () => { },
      meta: { title: `${appName} - 簡易工程管理` }
    },
    {
      path: '/apply/bulk',
      name: 'apply-bulk',
      component: () => { },
      meta: { title: `${appName} - 一括申請機能` }
    },
    {
      path: '/view/work',
      name: 'view-work',
      component: () => { },
      meta: { title: `${appName} - 勤務実態照会` }
    },
    {
      path: '/view/device-record',
      name: 'view-device-record',
      component: () => { },
      meta: { title: `${appName} - 勤務実態照会` }
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
      path: '/admin/config',
      name: 'admin-config',
      component: () => import('@/views/SystemConfigView.vue'),
      meta: { title: `${appName} - システム設定` },
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
      console.error(error);
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
        console.error(error);
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
