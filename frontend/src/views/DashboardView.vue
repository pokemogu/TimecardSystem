<script setup lang="ts">
import { RouterLink, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';

const router = useRouter();
const store = useSessionStore();

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="管理画面"
          v-bind:userName="store.userName"
        ></Header>
      </div>
    </div>

    <div class="row">
      <div class="col-2">打刻</div>
      <div class="col-4">各種申請</div>
      <div class="col-2">承認</div>
      <div class="col-4">管理機能</div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2">
        <RouterLink :to="{ name: 'record' }" class="btn btn-warning btn-sm" role="button">タイムカード</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink :to="{ name: 'apply-record' }" class="btn btn-warning btn-sm" role="button">打刻申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          :to="{ name: 'apply-generic-time-period', params: { type: 'break' } }"
          class="btn btn-warning btn-sm"
          role="button"
        >外出申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/approval/pending" class="btn btn-warning btn-sm" role="button">未承認一覧</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/unrecorded" class="btn btn-warning btn-sm" role="button">未打刻一覧</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/privilege" class="btn btn-warning btn-sm" role="button">権限設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink :to="{ name: 'apply-leave' }" class="btn btn-warning btn-sm" role="button">休暇申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          :to="{ name: 'apply-generic-time-period', params: { type: 'holiday-work' } }"
          class="btn btn-warning btn-sm"
          role="button"
        >休日出勤申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/approve/all" class="btn btn-warning btn-sm" role="button">全ての申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/vacation" class="btn btn-warning btn-sm" role="button">有給取得状況</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/duty" class="btn btn-warning btn-sm" role="button">勤務体系設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          to="/apply/generic-time-period/overtime"
          class="btn btn-warning btn-sm"
          role="button"
        >早出/残業申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/apply/makeup-leave" class="btn btn-warning btn-sm" role="button">代休申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/approve/route" class="btn btn-warning btn-sm" role="button">ルート設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/overtime" class="btn btn-warning btn-sm" role="button">残業状況</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          :to="{ name: 'admin-users' }"
          class="btn btn-warning btn-sm"
          role="button"
        >従業員照会(QRコード)</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          :to="{ name: 'apply-generic-time-period', params: { type: 'lateness' } }"
          class="btn btn-warning btn-sm"
          role="button"
        >遅刻申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/apply/other" class="btn btn-warning btn-sm" role="button">その他申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/approve/config" class="btn btn-warning btn-sm" role="button">申請種類設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/regproc" class="btn btn-warning btn-sm" role="button">簡易工程登録</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          :to="{ name: 'admin-reguser' }"
          class="btn btn-warning btn-sm"
          role="button"
        >従業員登録</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          :to="{ name: 'apply-generic-time-period', params: { type: 'leave-early' } }"
          class="btn btn-warning btn-sm"
          role="button"
        >早退申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/regclient" class="btn btn-warning btn-sm" role="button">端末名設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/duties" class="btn btn-warning btn-sm" role="button">勤務実態照会</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/bulkapply" class="btn btn-warning btn-sm" role="button">一括申請機能</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2"></div>
    </div>
  </div>
  <!--
<main>
    <TheWelcome />
  </main>
  -->
</template>

<style>
body {
  background: navajowhite !important;
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

.btn-primary {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
</style>