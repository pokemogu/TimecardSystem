<script setup lang="ts">
import { ref, Teleport } from 'vue';
import type { Ref } from 'vue';
import { RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import PasswordChange from '@/components/PasswordChange.vue';
import DeviceSelect from '@/components/DeviceSelect.vue';

const MAX_MENU_PER_COLUMN = 6;

const store = useSessionStore();

const isPasswordChangeOpened = ref(false);
const isDeviceSelectOpened = ref(false);
const selectedDeviceName = ref('');

interface DashboardMenu {
  description: string, linkName?: string, buttonRef?: Ref<boolean>
};

const recordMenus: DashboardMenu[] = [];
const applyMenus: DashboardMenu[] = [];
const applyMenusPerCol: DashboardMenu[][] = [];
const approvalMenus: DashboardMenu[] = [];
const adminMenus: DashboardMenu[] = [];
const adminMenusPerCol: DashboardMenu[][] = [];

// 打刻メニューの登録
if (store.privilege?.recordByLogin) { recordMenus.push({ description: 'タイムカード', linkName: 'record' }); }
recordMenus.push({ description: '勤務体系登録', linkName: 'work-pattern' });
recordMenus.push({ description: 'パスワード変更', buttonRef: isPasswordChangeOpened });
if (store.privilege?.registerDevice) { recordMenus.push({ description: '端末名設定', buttonRef: isDeviceSelectOpened }); }

// 申請メニューの登録
const applyPrivileges = store.privilege?.applyPrivileges;
if (applyPrivileges) {
  const applyPermitted = (name: string) => {
    return applyPrivileges.find(privilege => privilege.applyTypeName === name)?.permitted === true;
  }
  if (applyPermitted('record')) { applyMenus.push({ description: '打刻申請', linkName: 'apply-record' }); }
  //if (applyPermitted('leave')) { applyMenus.push({ description: '休暇申請', linkName: 'apply-leave' }); }
  /*
  if (applyPermitted('overtime')) { applyMenus.push({ description: '早出・残業申請', linkName: 'apply-overtime' }); }
  if (applyPermitted('lateness')) { applyMenus.push({ description: '遅刻申請', linkName: 'apply-lateness' }); }
  if (applyPermitted('leave-early')) { applyMenus.push({ description: '早退申請', linkName: 'apply-leave-early' }); }
  if (applyPermitted('break')) { applyMenus.push({ description: '外出申請', linkName: 'apply-break' }); }
  if (applyPermitted('holiday-work')) { applyMenus.push({ description: '休日出勤申請', linkName: 'apply-holiday-work' }); }
  if (applyPermitted('makeup-leave')) { applyMenus.push({ description: '代休申請', linkName: 'apply-makeup-leave' }); }
  */
  if (applyPrivileges.some(applyPrivilege => (applyPrivilege.isSystemType === false) && (applyPrivilege.permitted === true))) {
    applyMenus.push({ description: 'その他申請', linkName: 'apply-custom' });
  }
  applyMenus.push({ description: '申請一覧', linkName: 'apply-list' });
}

for (let i = 0, j = -1; i < applyMenus.length; i++) {
  if ((i % MAX_MENU_PER_COLUMN) === 0) {
    applyMenusPerCol.push([]);
    j++;
  }
  applyMenusPerCol[j].push(applyMenus[i]);
}

// 承認メニューの登録
if (store.privilege?.approve) {
  approvalMenus.push({ description: '承認一覧', linkName: 'approval-list' });
  //approvalMenus.push({ description: '全ての申請', linkName: 'approval-all' });
}
if (store.privilege?.configurePrivilege) {
  approvalMenus.push({ description: 'ルート設定', linkName: 'admin-route' });
  approvalMenus.push({ description: '申請種類設定', linkName: 'admin-custom-apply' });
}

// 管理メニューの登録
if (store.privilege?.viewRecord) { adminMenus.push({ description: '打刻一覧', linkName: 'view-record' }); }
if (store.privilege?.viewAllUserInfo || store.privilege?.viewDepartmentUserInfo || store.privilege?.viewSectionUserInfo) {
  //  adminMenus.push({ description: '有給取得状況', linkName: 'view-leave' });
  //  adminMenus.push({ description: '残業状況', linkName: 'view-overtime' });
  //  adminMenus.push({ description: '勤務実態照会', linkName: 'view-work' });
}
//if (store.privilege?.viewRecordPerDevice) { adminMenus.push({ description: '打刻一覧', linkName: 'view-record' }); }
//if (store.privilege?.viewRecordPerDevice) { adminMenus.push({ description: '簡易工程管理', linkName: 'view-device-record' }); }
if (store.privilege?.registerDevice) { adminMenus.push({ description: '打刻端末設定', linkName: 'admin-device' }); }
//if (store.privilege?.approve) { adminMenus.push({ description: '一括申請機能', linkName: 'apply-bulk' }); }
if (store.privilege?.configurePrivilege) { adminMenus.push({ description: '権限設定', linkName: 'admin-privilege' }); }
if (store.privilege?.configureWorkPattern) { adminMenus.push({ description: '勤務体系設定', linkName: 'admin-workpattern' }); }
if (store.privilege?.issueQr || store.privilege?.registerUser) {
  adminMenus.push({ description: '従業員登録・照会(QR)', linkName: 'admin-user' });
}
if (store.privilege?.configurePrivilege) {
  adminMenus.push({ description: 'システム設定', linkName: 'admin-config' });
  adminMenus.push({ description: '休日登録', linkName: 'admin-holiday' });
}
adminMenus.push({ description: '端末エラー履歴', linkName: 'errorlog' });

for (let i = 0, j = -1; i < adminMenus.length; i++) {
  if ((i % MAX_MENU_PER_COLUMN) === 0) {
    adminMenusPerCol.push([]);
    j++;
  }
  adminMenusPerCol[j].push(adminMenus[i]);
}

</script>

<template>
  <div class="container">
    <Teleport to="body" v-if="isPasswordChangeOpened">
      <PasswordChange v-model:isOpened="isPasswordChangeOpened" :confirmOldPasword="true"></PasswordChange>
    </Teleport>

    <Teleport to="body" v-if="isDeviceSelectOpened">
      <DeviceSelect v-model:isOpened="isDeviceSelectOpened" v-model:deviceName="selectedDeviceName"></DeviceSelect>
    </Teleport>

    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="メニュー画面" v-bind:userName="store.userName"></Header>
      </div>
    </div>
    <div class="row justify-content-start">

      <div class="col-2">
        <div class="row">
          <p>打刻</p>
        </div>
        <div class="row">
          <div class="col p-0">
            <div class="d-flex flex-column">
              <div v-for="(item, index) in recordMenus" class="p-1 d-grid">
                <RouterLink v-if="item.linkName" :to="{ name: item.linkName }" class="btn btn-warning btn-sm"
                  role="button">{{ item.description }}</RouterLink>
                <button v-else-if="item.buttonRef" class="btn btn-warning btn-sm"
                  v-on:click="item.buttonRef ? item.buttonRef.value = true : null">{{ item.description }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="row">
          <p>申請</p>
        </div>
        <div class="row">
          <div v-for="(applyMenusInCol, index) in applyMenusPerCol" class="col-6 p-0">
            <div class="d-flex flex-column">
              <div v-for="(item, index) in applyMenusInCol" class="p-1 d-grid">
                <RouterLink v-if="item.linkName" :to="{ name: item.linkName }" class="btn btn-warning btn-sm"
                  role="button">{{ item.description }}</RouterLink>
                <button v-else-if="item.buttonRef" class="btn btn-warning btn-sm"
                  v-on:click="item.buttonRef ? item.buttonRef.value = true : null">{{ item.description }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-2">
        <div class="row">
          <p>承認</p>
        </div>
        <div class="row">
          <div class="col p-0">
            <div class="d-flex flex-column">
              <div v-for="(item, index) in approvalMenus" class="p-1 d-grid">
                <RouterLink v-if="item.linkName" :to="{ name: item.linkName }" class="btn btn-warning btn-sm"
                  role="button">{{ item.description }}</RouterLink>
                <button v-else-if="item.buttonRef" class="btn btn-warning btn-sm"
                  v-on:click="item.buttonRef ? item.buttonRef.value = true : null">{{ item.description }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-4">
        <div class="row">
          <p>管理</p>
        </div>
        <div class="row">
          <div v-for="(adminMenusInCol, index) in adminMenusPerCol" class="col-6 p-0">
            <div class="d-flex flex-column">
              <div v-for="(item, index) in adminMenusInCol" class="p-1 d-grid">
                <RouterLink v-if="item.linkName" :to="{ name: item.linkName }" class="btn btn-warning btn-sm"
                  role="button">{{ item.description }}</RouterLink>
                <button v-else-if="item.buttonRef" class="btn btn-warning btn-sm"
                  v-on:click="item.buttonRef ? item.buttonRef.value = true : null">{{ item.description }}</button>
              </div>
            </div>
          </div>
        </div>
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