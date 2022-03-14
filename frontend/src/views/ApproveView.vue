<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';

import * as backendAccess from '@/BackendAccess';

const router = useRouter();
const store = useSessionStore();

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="承認一覧画面"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push('/dashboard')"
        ></Header>
      </div>
    </div>

    <div class="row m-1">
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="export">エクスポート</button>
      </div>
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="select-layout">レイアウト選択</button>
      </div>
      <div class="d-grid gap-2 col-2">
        <button type="button" class="btn btn-primary" id="configure-layout">レイアウト設定</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a class="nav-link" href="#">未承認</a>
          </li>
          <li class="nav-item">
            <a class="nav-link active" href="#">否認済</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">承認済</a>
          </li>
          <li class="nav-item">
            <a class="nav-link">全て</a>
          </li>
        </ul>
      </div>
    </div>
    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col">
                <input class="form-check-input" type="checkbox" id="checkboxall" value />
              </th>
              <th scope="col">申請種類</th>
              <th scope="col">申請日</th>
              <th scope="col">申請者</th>
              <th scope="col">申請期間</th>
              <th scope="col">承認1</th>
              <th scope="col">承認2</th>
              <th scope="col">承認3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox1" value />
              </th>
              <td>Mark</td>
              <td>Otto</td>
              <td>@mdo</td>
            </tr>
            <tr>
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox2" value />
              </th>
              <td>Jacob</td>
              <td>Thornton</td>
              <td>@fat</td>
            </tr>
            <tr>
              <th scope="row">
                <input class="form-check-input" type="checkbox" id="checkbox3" value />
              </th>
              <td colspan="2">Larry the Bird</td>
              <td>@twitter</td>
            </tr>
          </tbody>
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