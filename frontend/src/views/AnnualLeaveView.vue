<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useLoading } from 'vue-loading-overlay'
import { useSessionStore } from '@/stores/session';

import lodash from 'lodash';

import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';

import generateQrCodePDF from '@/GenerateQrCodePDF';

import UserEdit from '@/components/UserEdit.vue';
import PasswordChange from '@/components/PasswordChange.vue';
import BulkAddUsers from '@/components/BulkAddUsers.vue';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const userInfos = ref<apiif.UserInfoResponseData[]>([]);
const selectedUserInfo = ref<apiif.UserInfoRequestData>({ account: '', name: '', privilegeName: '', defaultWorkPatternName: '' });
const checks = ref<boolean[]>([]);
const isModalOpened = ref(false);
const isBulkModalOpened = ref(false);
const isPasswordChangeOpened = ref(false);

const limit = ref(10);
const offset = ref(0);

const dateFrom = ref('');
const dateTo = ref('');
const accountSearch = ref('');
const nameSearch = ref('');
const departmentSearch = ref('');
const sectionSearch = ref('');
const statusSearch = ref('');

const UpdateOnSearch = async function () {
  offset.value = 0;
  await updateUserList();
}

watch(dateFrom, lodash.debounce(UpdateOnSearch, 200));
watch(dateTo, lodash.debounce(UpdateOnSearch, 200));
watch(accountSearch, lodash.debounce(UpdateOnSearch, 200));
watch(nameSearch, lodash.debounce(UpdateOnSearch, 200));
watch(departmentSearch, lodash.debounce(UpdateOnSearch, 200));
watch(sectionSearch, lodash.debounce(UpdateOnSearch, 200));
watch(statusSearch, lodash.debounce(UpdateOnSearch, 200));

const $loading = useLoading();
const updateUserList = async () => {

  const loader = $loading.show({ opacity: 0 });

  try {
    const access = await store.getTokenAccess();
    const infos = await access.getUsersInfo({
      accounts: accountSearch.value !== '' ? [accountSearch.value] : undefined,
      name: nameSearch.value !== '' ? nameSearch.value : undefined,
      department: departmentSearch.value !== '' ? departmentSearch.value : undefined,
      section: sectionSearch.value !== '' ? sectionSearch.value : undefined,
      registeredFrom: dateFrom.value !== '' ? new Date(dateFrom.value) : undefined,
      registeredTo: dateTo.value !== '' ? new Date(dateTo.value) : undefined,
      isQrCodeIssued: statusSearch.value !== '' ? (statusSearch.value === 'issued' ? true : false) : undefined,
      limit: limit.value + 1,
      offset: offset.value
    });

    if (infos) {
      userInfos.value.splice(0);
      Array.prototype.push.apply(userInfos.value, infos);
    }
    checks.value = Array.from({ length: userInfos.value.length }, () => false);
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }

  loader.hide();
}

onMounted(async () => {
  await updateUserList();
})

const isNewAccount = ref(true);

async function onUserClick(account?: string) {
  const loader = $loading.show({ opacity: 0 });
  try {
    if (account) {
      const access = await store.getTokenAccess();
      const userInfo = await access.getUserInfo(account);
      if (userInfo) {
        selectedUserInfo.value = {
          account: userInfo.account, name: userInfo.name, phonetic: userInfo.phonetic,
          email: userInfo.email, section: userInfo.section, department: userInfo.department,
          privilegeName: userInfo.privilegeName,
          defaultWorkPatternName: userInfo.defaultWorkPatternName,
          optional1WorkPatternName: userInfo.optional1WorkPatternName,
          optional2WorkPatternName: userInfo.optional2WorkPatternName
        };
      }
      isNewAccount.value = false;
    }
    else {
      selectedUserInfo.value = { account: '', name: '', privilegeName: '', defaultWorkPatternName: '' };
      isNewAccount.value = true;
    }
    isModalOpened.value = true;
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  loader.hide();
}

async function onIssueQrCode() {
  const userInfoforQrCode: {
    name: string,
    account: string,
    section: string,
    refreshToken: string
  }[] = [];

  const loader = $loading.show({ opacity: 0 });
  for (let i = 0; i < userInfos.value.length; i++) {
    try {
      if (checks.value[i]) {
        const access = await store.getTokenAccess();
        const issuedToken = await access.issueRefreshTokenForOtherUser(userInfos.value[i].account);
        if (issuedToken?.refreshToken) {
          userInfoforQrCode.push({
            name: userInfos.value[i].name,
            account: userInfos.value[i].account,
            refreshToken: issuedToken.refreshToken,
            section: userInfos.value[i].section ?? ''
          });
        }
      }
    }
    catch (error) {
      console.error(error);
      await putErrorToDB(store.userAccount, error as Error);
      alert(error);
    }
  }

  try {
    if (userInfoforQrCode.length > 0) {
      await generateQrCodePDF(userInfoforQrCode).then(() => {
        alert('QRコードの発行が完了しました。発行されたQRコードが各打刻端末で使用できるのは1時間後となります。');
      });
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  loader.hide();

  checks.value = [];
  await updateUserList();
}

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  await updateUserList();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  await updateUserList();
}

async function onSubmit() {
  try {
    const access = await store.getTokenAccess();
    await access.addUsers([selectedUserInfo.value]);

    // 新規ユーザー追加の場合は初期パスワード入力画面を表示する
    if (isNewAccount.value === true) {
      isPasswordChangeOpened.value = true;
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  await updateUserList();
}

async function onPasswordChange() {
  isPasswordChangeOpened.value = true;
  await updateUserList();
}

async function onDelete() {
  try {
    const access = await store.getTokenAccess();
    await access.disableUser(selectedUserInfo.value.account);
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  await updateUserList();
}

function onBulkAddClick() {
  isBulkModalOpened.value = true;
}

const bulkUserData = ref<apiif.UserInfoRequestDataWithPassword[]>([]);
async function onSubmitBulk() {
  const loader = $loading.show({ opacity: 0 });
  try {
    const access = await store.getTokenAccess();
    await access.addUsers(bulkUserData.value);

    for (const user of bulkUserData.value) {
      await access.changePassword({ account: user.account, newPassword: user.password })
    }
    loader.hide();
    alert('一括追加が完了しました。');
  }
  catch (error) {
    loader.hide();
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  await updateUserList();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="従業員登録・照会(QRコード発行)" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <UserEdit v-model:isOpened="isModalOpened" v-model:userInfo="selectedUserInfo" v-on:submit="onSubmit"
        v-on:submitDelete="onDelete" v-on:submitPasswordChange="onPasswordChange"></UserEdit>
    </Teleport>

    <Teleport to="body" v-if="isPasswordChangeOpened">
      <PasswordChange v-model:isOpened="isPasswordChangeOpened" :confirmOldPasword="false"
        :account="selectedUserInfo.account"></PasswordChange>
    </Teleport>

    <Teleport to="body" v-if="isBulkModalOpened">
      <BulkAddUsers v-model:isOpened="isBulkModalOpened" v-model:bulkUsers="bulkUserData" v-on:submit="onSubmitBulk">
      </BulkAddUsers>
    </Teleport>

    <div class="row justify-content-end p-2">
      <div class="d-grid gap-2 col-2">
        <div class="btn-group">
          <button type="button" class="btn btn-primary" id="new-user" v-on:click="onUserClick()">従業員ID追加</button>
          <button type="button" class="btn btn-primary dropdown-toggle dropdown-toggle-split"
            data-bs-toggle="dropdown"></button>
          <ul class="dropdown-menu">
            <li>
              <button class="dropdown-item" v-on:click="onBulkAddClick">従業員ID一括追加</button>
            </li>
          </ul>
        </div>
      </div>
      <!--
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="new-user" v-on:click="onBulkAddClick">従業員ID一括追加</button>
      </div>
      -->
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="issue-qr" v-on:click="onIssueQrCode"
          v-bind:disabled="checks.every(check => check === false)">チェックした従業員のQRコード発行</button>
      </div>
      <div class="col-md-6">
        <div class="input-group">
          <span class="input-group-text">従業員登録日で検索</span>
          <input class="form-control form-control-sm" type="date" v-model="dateFrom" />〜
          <input class="form-control form-control-sm" type="date" v-model="dateTo" />
        </div>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">従業員登録日</th>
              <th scope="col">ID</th>
              <th scope="col">氏名</th>
              <th scope="col">部門</th>
              <th scope="col">部署</th>
              <th scope="col">ステータス</th>
            </tr>
            <tr>
              <th scope="col">
                <!-- <input class="form-check-input" type="checkbox" id="checkboxall" value /> -->
              </th>
              <th scope="col"></th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="accountSearch"
                  placeholder="完全一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="nameSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="departmentSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" v-model="sectionSearch"
                  placeholder="部分一致" />
              </th>
              <th scope="col">
                <select class="form-select form-select-sm" v-model="statusSearch">
                  <option selected></option>
                  <option value="notIssued">未発行</option>
                  <option value="issued">発行済</option>
                </select>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, index) in userInfos.slice(0, limit)">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index" v-model="checks[index]" />
              </th>
              <td>{{ new Date(user.registeredAt ?? '').toLocaleDateString() }}</td>
              <td>
                <button type="button" class="btn btn-link" v-on:click="onUserClick(user.account)">
                  {{ user.account }}
                </button>
              </td>
              <td>{{ user.name }}</td>
              <td>{{ user.department }}</td>
              <td>{{ user.section }}</td>
              <td>{{ (user.qrCodeIssueNum ?? 0) > 0 ? '発行済' : '未発行' }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7">
                <nav>
                  <ul class="pagination">
                    <li class="page-item" v-bind:class="{ disabled: offset <= 0 }">
                      <button class="page-link" v-on:click="onPageBack">
                        <span>&laquo;</span>
                      </button>
                    </li>
                    <li class="page-item" v-bind:class="{ disabled: userInfos.length <= limit }">
                      <button class="page-link" v-on:click="onPageForward">
                        <span>&raquo;</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </td>
            </tr>
          </tfoot>
        </table>
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

.nav-tabs .nav-item .nav-link {
  background-color: navajowhite !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}

.nav-tabs .nav-item .nav-link.active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
</style>