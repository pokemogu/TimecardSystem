<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';

import * as backendAccess from '@/BackendAccess';

const router = useRouter();
const store = useSessionStore();

const userDepartment = ref('');
const userSection = ref('');

store.getToken()
  .then((token) => {
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
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

const applyTypeValue = ref('notyet');
watch(applyTypeValue, (value) => {
  console.log(value);
});

const applyTypeOptions = ref<{ value: string, name: string }[]>([
  { value: 'notyet', name: '未打刻' },
  { value: 'athome', name: '在宅' },
  { value: 'trip', name: '出張' },
  { value: 'withdrawal', name: '外出' }
]);

const dateFrom = ref(new Date().toISOString().slice(0, 10));

function onSubmit() {
  console.log(applyTypeValue.value);
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
        <ApplyForm
          applyName="打刻"
          v-bind:userName="store.userName"
          v-bind:userDepartment="userDepartment"
          v-bind:userSection="userSection"
          v-model:applyTypeValue="applyTypeValue"
          v-bind:applyTypeOptions="applyTypeOptions"
          v-model:dateFrom="dateFrom"
          v-on:submit="onSubmit"
        ></ApplyForm>
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