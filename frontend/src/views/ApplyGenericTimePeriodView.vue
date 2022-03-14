<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';

import * as backendAccess from '@/BackendAccess';

const route = useRoute();
const router = useRouter();
const store = useSessionStore();

const applyTypeAndName: { [name: string]: string } = {
  'overtime': '早出・残業',
  'lateness': '遅刻',
  'leave-early': '早退',
  'break': '外出',
  'holiday-work': '休日出勤',
};

console.log(route.params);
const applyType = ref((route.params as { type?: string }).type);
if (!applyType.value) {
  router.push('dashboard');
}

const userDepartment = ref('');
const userSection = ref('');

const dateFrom = ref('');
const timeFrom = ref('');
const timeTo = ref('');
const reason = ref('');

store.getToken()
  .then((token) => {
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token.accessToken);
      tokenAccess.getUserInfo(store.userId)
        .then((userInfo) => {
          if (userInfo) {
            if (userInfo.department) {
              userDepartment.value = userInfo.department;
            }
            if (userInfo.section) {
              userSection.value = userInfo.section;
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  })
  .catch((error) => {
    console.log(error);
  });

function onSubmit() {
  console.log(dateFrom.value);
  router.push('/dashboard');
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="申請画面"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push('/dashboard')"
        ></Header>
      </div>
    </div>

    <div class="row">
      <div class="col-10 bg-white p-2 shadow-sm">
        <div class="row">
          <ApplyForm
            v-bind:applyName="applyType ? applyTypeAndName[applyType] : ''"
            v-bind:applyType="applyType || ''"
            v-bind:userName="store.userName"
            v-bind:userDepartment="userDepartment"
            v-bind:userSection="userSection"
            v-model:dateFrom="dateFrom"
            v-model:timeFrom="timeFrom"
            v-model:timeTo="timeTo"
            v-model:reason="reason"
            v-on:submit="onSubmit"
          ></ApplyForm>
        </div>
        <div v-if="applyType === 'holiday-work'" class="row">
          <div class="col-9"></div>
          <div class="col-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value id="flexCheckChecked" checked />
              <label class="form-check-label" for="flexCheckChecked">同時に代休を申請する</label>
            </div>
          </div>
        </div>
      </div>
      <div class="col-2">
        <div class="row">承認待ち</div>
        <div class="row">否認</div>
        <div class="row">決済済</div>
        <div class="row">申請</div>
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
</style>