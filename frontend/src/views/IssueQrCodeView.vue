<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

const router = useRouter();
const store = useSessionStore();

const userInfos = ref<apiif.UserInfoResponseData[]>([]);
const checks = ref<boolean[]>([]);

const limit = ref(10);
const offset = ref(0);

const updateUserList = async () => {

  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
      const infos = await tokenAccess.getUserInfos({ limit: limit.value + 1, offset: offset.value });

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

function onIssueQrCode() {
  for (let i = 0; i < userInfos.value.length; i++) {
    if (checks.value[i]) {
      console.log(userInfos.value[i]);
    }
  }
  checks.value = [];
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
          titleName="QRコード発行画面"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <div class="row justify-content-end p-2">
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="export" v-on:click="onIssueQrCode">QRコード発行</button>
      </div>
      <div class="col-md-5">
        <div class="input-group">
          <span class="input-group-text">従業員登録日で検索</span>
          <input class="form-control form-control-sm" type="date" />〜
          <input class="form-control form-control-sm" type="date" />
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
                <input class="form-control form-control-sm" type="text" size="3" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" />
              </th>
              <th scope="col">
                <input class="form-control form-control-sm" type="text" size="3" />
              </th>
              <th scope="col">
                <select class="form-select form-select-sm" aria-label="Default select example">
                  <option selected></option>
                  <option value="1">未発行</option>
                  <option value="2">発行済</option>
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
              <td>{{ user.account }}</td>
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