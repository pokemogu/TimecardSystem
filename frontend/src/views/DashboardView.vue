<script setup lang="ts">
import TheWelcome from '@/components/TheWelcome.vue'
import { ref, computed, inject } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import type { TimecardSession } from '../timecard-session-interface';

const session = inject<TimecardSession>('session');

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
          <div class="container-fluid">
            <span class="navbar-text">管理画面</span>
            <div class="collapse navbar-collapse justify-content-end">
              <!-- <span class="navbar-text">管理者PC</span> -->
              <span class="navbar-text">{{ session?.userName }}</span>
            </div>
            <RouterLink to="/logout" class="ms-2 btn btn-warning btn-sm" role="button">ログアウト</RouterLink>
          </div>
        </nav>
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
        <RouterLink to="/user/record" class="btn btn-warning btn-sm" role="button">タイムカード</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/record" class="btn btn-warning btn-sm" role="button">打刻申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/withdrawal" class="btn btn-warning btn-sm" role="button">外出申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          to="/user/approval/unapproved"
          class="btn btn-warning btn-sm"
          role="button"
        >未承認一覧</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/unrecorded" class="btn btn-warning btn-sm" role="button">未打刻一覧</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/privilege" class="btn btn-warning btn-sm" role="button">権限設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/leave" class="btn btn-warning btn-sm" role="button">休暇申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/holidaywork" class="btn btn-warning btn-sm" role="button">休日出勤申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/approval/all" class="btn btn-warning btn-sm" role="button">全ての申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/vacation" class="btn btn-warning btn-sm" role="button">有給取得状況</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/duty" class="btn btn-warning btn-sm" role="button">勤務体系設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/overtime" class="btn btn-warning btn-sm" role="button">早出/残業申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/leave" class="btn btn-warning btn-sm" role="button">代休申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/approval/route" class="btn btn-warning btn-sm" role="button">ルート設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/overtime" class="btn btn-warning btn-sm" role="button">残業状況</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/issueqr" class="btn btn-warning btn-sm" role="button">QRコード発行</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/lateness" class="btn btn-warning btn-sm" role="button">遅刻申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/other" class="btn btn-warning btn-sm" role="button">その他申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/approval/config" class="btn btn-warning btn-sm" role="button">申請種類設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/regproc" class="btn btn-warning btn-sm" role="button">簡易工程登録</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/reguser" class="btn btn-warning btn-sm" role="button">従業員登録</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/apply/earliness" class="btn btn-warning btn-sm" role="button">早退申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/regclient" class="btn btn-warning btn-sm" role="button">端末名設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/duties" class="btn btn-warning btn-sm" role="button">勤務実態照会</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/user/admin/bulkapply" class="btn btn-warning btn-sm" role="button">一括申請機能</RouterLink>
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