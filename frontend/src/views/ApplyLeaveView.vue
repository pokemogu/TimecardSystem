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

const applyTypeOptions1 = ref<{ name: string, description: string }[]>([]);
const applyTypeValue1 = ref('');
const applyTypeOptions2 = ref<{ name: string, description: string }[]>([]);
const applyTypeValue2 = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const reason = ref('');
const contact = ref('');

backendAccess.getApplyTypeOptions('leave')
  .then((applyTypeOptions) => {
    if (applyTypeOptions?.optionTypes) {
      applyTypeOptions1.value = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'leaveType')?.options || [];
      applyTypeValue1.value = applyTypeOptions1.value.length > 0 ? applyTypeOptions1.value[0].name : '';
    }
    console.log(applyTypeOptions)
  })
  .catch((error) => {
    console.log(error);
  });

store.getToken()
  .then((token) => {
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token.accessToken);
      tokenAccess.getUserInfo(store.userAccount)
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

watch(applyTypeValue1, (value) => {
  console.log(value);
});

watch(applyTypeValue2, (value) => {
  console.log(value);
});

function onSubmit() {
  store.getToken()
    .then((token) => {
      if (token) {
        const tokenAccess = new backendAccess.TokenAccess(token.accessToken);
        tokenAccess.apply('leave', {
          dateFrom: new Date(`${dateFrom.value}T00:00:00`),
          dateTo: dateTo.value !== '' ? new Date(`${dateTo.value}T23:59:59`) : undefined,
          timestamp: new Date(),
          options: [
            { name: 'leaveType', value: applyTypeValue1.value }
          ],
          reason: reason.value
        });

        router.push({ name: 'dashboard' });
      }
    })
    .catch((error) => {
      alert(error);
    });
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
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <div class="row">
      <div class="col-10 bg-white p-2 shadow-sm">
        <ApplyForm
          applyName="休暇"
          applyType="leave"
          v-bind:userName="store.userName"
          v-bind:userDepartment="userDepartment"
          v-bind:userSection="userSection"
          v-model:applyTypeValue1="applyTypeValue1"
          v-bind:applyTypeOptions1="applyTypeOptions1"
          v-model:dateFrom="dateFrom"
          v-model:dateTo="dateTo"
          v-bind:isDateToOptional="true"
          v-model:reason="reason"
          v-model:contact="contact"
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