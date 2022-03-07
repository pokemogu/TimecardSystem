import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import { nextTick, provide, inject } from 'vue';

import type { TimecardSession } from '../timecard-session-interface';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: '勤怠管理システム - ログイン'
      }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/record',
      name: 'record',
      component: () => import('../views/RecordView.vue'),
      meta: {
        title: '勤怠管理システム - 打刻'
      }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: {
        title: '勤怠管理システム - 管理'
      }
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
      component: () => import('../views/Logout.vue')
    },
    {
      path: '/user/record',
      name: 'user-record',
      component: () => import('../views/UserRecordView.vue')
    }
  ]
});

router.afterEach((to, from) => {
  nextTick(() => {
    document.title = to.meta.title as string || '勤怠管理システム';
  });
});

export default router;
