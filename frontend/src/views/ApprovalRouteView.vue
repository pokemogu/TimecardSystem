<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import lodash from 'lodash';

import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

import generateQrCodePDF from '../GenerateQrCodePDF';

const router = useRouter();
const store = useSessionStore();

const userInfos = ref<apiif.UserInfoResponseData[]>([]);
const checks = ref<boolean[]>([]);

const limit = ref(10);
const offset = ref(0);

const dateFrom = ref('');
const dateTo = ref('');
const accountSearch = ref('');
const nameSearch = ref('');
const departmentSearch = ref('');
const sectionSearch = ref('');
const statusSearch = ref('');

const UpdateOnSearch = function () {
  offset.value = 0;
  updateUserList();
}

watch(dateFrom, lodash.debounce(UpdateOnSearch, 200));
watch(dateTo, lodash.debounce(UpdateOnSearch, 200));
watch(accountSearch, lodash.debounce(UpdateOnSearch, 200));
watch(nameSearch, lodash.debounce(UpdateOnSearch, 200));
watch(departmentSearch, lodash.debounce(UpdateOnSearch, 200));
watch(sectionSearch, lodash.debounce(UpdateOnSearch, 200));
watch(statusSearch, lodash.debounce(UpdateOnSearch, 200));

const updateUserList = async () => {

  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
      const infos = await tokenAccess.getUserInfos({
        byAccount: accountSearch.value !== '' ? accountSearch.value : undefined,
        byName: nameSearch.value !== '' ? nameSearch.value : undefined,
        byDepartment: departmentSearch.value !== '' ? departmentSearch.value : undefined,
        bySection: sectionSearch.value !== '' ? sectionSearch.value : undefined,
        registeredFrom: dateFrom.value !== '' ? new Date(dateFrom.value) : undefined,
        registeredTo: dateTo.value !== '' ? new Date(dateTo.value) : undefined,
        isQrCodeIssued: statusSearch.value !== '' ? (statusSearch.value === 'issued' ? true : false) : undefined,
        limit: limit.value + 1,
        offset: offset.value
      });

      userInfos.value = [];
      Array.prototype.push.apply(userInfos.value, infos);
      checks.value = Array.from({ length: userInfos.value.length }, () => false);
    }
  }
  catch (error) {
    alert(error);
  }
}

updateUserList();

async function onIssueQrCode() {
  const userInfoforQrCode: {
    name: string,
    account: string,
    section: string,
    refreshToken: string
  }[] = [];

  for (let i = 0; i < userInfos.value.length; i++) {
    try {
      if (checks.value[i]) {
        const token = await store.getToken();
        if (token) {
          const tokenAccess = new backendAccess.TokenAccess(token);
          const issuedToken = await tokenAccess.issueRefreshTokenForOtherUser(userInfos.value[i].account);
          if (issuedToken.token) {
            userInfoforQrCode.push({
              name: userInfos.value[i].name,
              account: userInfos.value[i].account,
              refreshToken: issuedToken.token.refreshToken,
              section: userInfos.value[i].section
            });
          }
        }
      }
    }
    catch (error) {
      alert(error);
    }
  }
  if (userInfoforQrCode.length > 0) {
    generateQrCodePDF(userInfoforQrCode).then(() => {
    });
  }
  checks.value = [];
  updateUserList();
}

function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  updateUserList();
}

function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  updateUserList();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="従業員照会(QRコード)"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <div class="row justify-content-end p-2">
      <div class="d-grid gap-2 col-4">
        <button
          type="button"
          class="btn btn-primary"
          id="export"
          v-on:click="onIssueQrCode"
          v-bind:disabled="checks.every(check => check === false)"
        >チェックした従業員のQRコード発行</button>
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
              <th scope="col">ルート名</th>
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
                <input
                  class="form-control form-control-sm"
                  type="text"
                  size="3"
                  v-model="accountSearch"
                  placeholder="完全一致"
                />
              </th>
              <th scope="col">
                <input
                  class="form-control form-control-sm"
                  type="text"
                  size="3"
                  v-model="nameSearch"
                  placeholder="部分一致"
                />
              </th>
              <th scope="col">
                <input
                  class="form-control form-control-sm"
                  type="text"
                  size="3"
                  v-model="departmentSearch"
                  placeholder="部分一致"
                />
              </th>
              <th scope="col">
                <input
                  class="form-control form-control-sm"
                  type="text"
                  size="3"
                  v-model="sectionSearch"
                  placeholder="部分一致"
                />
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
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'checkbox' + index"
                  v-model="checks[index]"
                />
              </th>
              <td>{{ new Date(user.registeredAt).toLocaleDateString() }}</td>
              <td>
                <RouterLink
                  :to="{ name: 'admin-user', params: { account: user.account } }"
                >{{ user.account }}</RouterLink>
              </td>
              <td>{{ user.name }}</td>
              <td>{{ user.department }}</td>
              <td>{{ user.section }}</td>
              <td>{{ user.qrCodeIssueNum > 0 ? '発行済' : '未発行' }}</td>
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
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

.btn-primary {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
/*
.nav-item {
  background: navajowhite !important;
}

.nav-item:active {
  background: navajowhite !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
}

.nav-pills .nav-link:active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
*/
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