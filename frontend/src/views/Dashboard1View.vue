<script setup lang="ts">
import { ref, Teleport } from 'vue';
import { RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import PasswordChange from '@/components/PasswordChange.vue';
import DeviceSelect from '@/components/DeviceSelect.vue';

const store = useSessionStore();
const privilege = ref(store.privilege);
const applyPrivileges = ref(store.privilege.applyPrivileges);
console.log(store.privilege);

const isPasswordChangeOpened = ref(false);
const isDeviceSelectOpened = ref(false);
const selectedDeviceName = ref('');

</script>

<template>
  <div class="container">
    <Teleport to="body" v-if="isPasswordChangeOpened">
      <PasswordChange v-model:isOpened="isPasswordChangeOpened"></PasswordChange>
    </Teleport>

    <Teleport to="body" v-if="isDeviceSelectOpened">
      <DeviceSelect v-model:isOpened="isDeviceSelectOpened" v-model:deviceName="selectedDeviceName"></DeviceSelect>
    </Teleport>

    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="メニュー画面" v-bind:userName="store.userName"></Header>
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
        <RouterLink v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'record')?.permitted === true"
          :to="{ name: 'apply-record' }" class="btn btn-warning btn-sm" role="button">打刻申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'break')?.permitted === true"
          :to="{ name: 'apply-break' }" class="btn btn-warning btn-sm" role="button">外出申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.approve" to="/approval/pending" class="btn btn-warning btn-sm" role="button">
          未承認一覧</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/unrecorded" class="btn btn-warning btn-sm" role="button">未打刻一覧</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.configurePrivilege" to="/admin/privilege" class="btn btn-warning btn-sm"
          role="button">権限設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2">
        <RouterLink :to="{ name: 'work-pattern' }" class="btn btn-warning btn-sm" role="button">勤務体系登録</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'leave')?.permitted === true"
          :to="{ name: 'apply-leave' }" class="btn btn-warning btn-sm" role="button">休暇申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'holiday-work')?.permitted === true"
          :to="{ name: 'apply-holiday-work' }" class="btn btn-warning btn-sm" role="button">休日出勤申請
        </RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/approve/all" class="btn btn-warning btn-sm" role="button">全ての申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/vacation" class="btn btn-warning btn-sm" role="button">有給取得状況</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.configureWorkPattern" :to="{ name: 'admin-workpattern' }"
          class="btn btn-warning btn-sm" role="button">勤務体系設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2">
        <button class="btn btn-warning btn-sm" v-on:click="isPasswordChangeOpened = true">パスワード変更</button>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'overtime')?.permitted === true"
          :to="{ name: 'apply-overtime' }" class="btn btn-warning btn-sm" role="button">早出・残業申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'makeup-leave')?.permitted === true"
          :to="{ name: 'apply-makeup-leave' }" class="btn btn-warning btn-sm" role="button">代休申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.configurePrivilege" :to="{ name: 'admin-route' }" class="btn btn-warning btn-sm"
          role="button">ルート設定</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/overtime" class="btn btn-warning btn-sm" role="button">残業状況</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.registerUser || privilege.issueQr" :to="{ name: 'admin-user' }"
          class="btn btn-warning btn-sm" role="button">従業員登録・照会(QR)</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2">
        <button v-if="privilege.registerDevice" class="btn btn-warning btn-sm"
          v-on:click="isDeviceSelectOpened = true">端末名設定</button>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'lateness')?.permitted === true"
          :to="{ name: 'apply-lateness' }" class="btn btn-warning btn-sm" role="button">遅刻申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink :to="{ name: 'apply-custom' }" class="btn btn-warning btn-sm" role="button">その他申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink :to="{ name: 'admin-custom-apply' }" class="btn btn-warning btn-sm" role="button">申請種類設定
        </RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/regproc" class="btn btn-warning btn-sm" role="button">簡易工程管理</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.configurePrivilege" to="/admin/config" class="btn btn-warning btn-sm" role="button">
          システム設定</RouterLink>
      </div>
    </div>

    <div class="row g-2 mt-2">
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink
          v-if="applyPrivileges.find(privilege => privilege.applyTypeName === 'leave-early')?.permitted === true"
          :to="{ name: 'apply-leave-early' }" class="btn btn-warning btn-sm" role="button">早退申請</RouterLink>
      </div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2"></div>
      <div class="d-grid col-2 gap-2">
        <RouterLink v-if="privilege.registerDevice" :to="{ name: 'admin-device' }" class="btn btn-warning btn-sm"
          role="button">打刻端末設定</RouterLink>
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
      <div class="d-grid col-2 gap-2">
        <RouterLink to="/admin/holiday" class="btn btn-warning btn-sm" role="button">休日登録</RouterLink>
      </div>
    </div>
  </div>
</template>

<style>
body {
  background: navajowhite !important;
}

/* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

.btn-primary {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
</style>