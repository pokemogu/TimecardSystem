<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';
import ApprovalRouteSelect from '@/components/ApprovalRouteSelect.vue';

import * as backendAccess from '@/BackendAccess';

const router = useRouter();
const store = useSessionStore();

const applyTypeOptions1 = ref<{ name: string, description: string }[]>([]);
const applyTypeValue1 = ref('');
const applyTypeOptions2 = ref<{ name: string, description: string }[]>([]);
const applyTypeValue2 = ref('');
const dateFrom = ref(new Date().toISOString().slice(0, 10));
const timeFrom = ref('');
const reason = ref('');

onMounted(async () => {
  try {
    const applyTypeOptions = await backendAccess.getApplyTypeOptions('record');
    if (applyTypeOptions?.optionTypes) {
      applyTypeOptions1.value = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'situation')?.options || [];
      applyTypeValue1.value = applyTypeOptions1.value.length > 0 ? applyTypeOptions1.value[0].name : '';

      applyTypeOptions2.value = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'recordType')?.options || [];
      applyTypeValue2.value = applyTypeOptions2.value.length > 0 ? applyTypeOptions2.value[0].name : '';
    }
  } catch (error) {
    alert(error);
  }
});

const routeName = ref('');
const isApprovalRouteSelectOpened = ref(false);

async function onFormSubmit() {
  isApprovalRouteSelectOpened.value = true;
}

async function onRouteSubmit() {
  try {
    if (store.isLoggedIn()) {
      const token = await store.getToken();
      if (token) {
        const access = new backendAccess.TokenAccess(token);
        const applyId = await access.apply('record', {
          dateFrom: new Date(`${dateFrom.value}T${timeFrom.value}:00`).toISOString(),
          timestamp: new Date().toISOString(),
          options: [
            { name: 'situation', value: applyTypeValue1.value },
            { name: 'recordType', value: applyTypeValue2.value }
          ],
          reason: reason.value,
          route: routeName.value
        });

        const routeInfo = await access.getApprovalRoute(routeName.value);
        if (routeInfo) {
          const smallestLevelRole = routeInfo.roles.reduce((prev, cur) => prev.level < cur.level ? prev : cur);
          const emails: string[] = [];
          for (const user of smallestLevelRole.users) {
            console.log(user.account);
            const userInfo = await access.getUserInfo(user.account);
            if (userInfo) {
              emails.push(userInfo.email);
            }
          }

          const mailBody =
            `以下の通り申請致しますのでご承認お願い致します。

${window.location.origin}/approve/${applyId}`

          location.href =
            'mailto: ' + emails.join(', ') +
            '?subject=打刻申請の承認依頼' +
            '&body=' + encodeURIComponent(mailBody.replace('\n', '\r\n'));
        }

        router.push({ name: 'dashboard' });
      }
    }
  } catch (error) {
    alert(error);
  }
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

    <Teleport to="body" v-if="isApprovalRouteSelectOpened">
      <ApprovalRouteSelect
        v-model:routeName="routeName"
        v-model:isOpened="isApprovalRouteSelectOpened"
        v-on:submit="onRouteSubmit"
      ></ApprovalRouteSelect>
    </Teleport>

    <div class="row">
      <div class="col-10 bg-white p-2 shadow-sm">
        <ApplyForm
          applyName="打刻"
          applyType="record"
          v-model:applyTypeValue1="applyTypeValue1"
          v-bind:applyTypeOptions1="applyTypeOptions1"
          v-model:applyTypeValue2="applyTypeValue2"
          v-bind:applyTypeOptions2="applyTypeOptions2"
          v-model:dateFrom="dateFrom"
          v-model:timeFrom="timeFrom"
          v-model:reason="reason"
          v-on:submit="onFormSubmit"
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