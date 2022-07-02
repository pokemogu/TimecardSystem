<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';
import ApprovalRouteSelect from '@/components/ApprovalRouteSelect.vue';

import * as backendAccess from '@/BackendAccess';
import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

const applyTypeOptions1 = ref<{ type: string, options: { name: string, description: string }[] }>({ type: 'situation', options: [] });
const applyTypeValue1 = ref('');
const applyTypeOptions2 = ref<{ type: string, options: { name: string, description: string }[] }>({ type: 'recordType', options: [] });
const applyTypeValue2 = ref('');
const dateFrom = ref(new Date().toISOString().slice(0, 10));
const timeFrom = ref('');
const reason = ref('');
const apply = ref<apiif.ApplyResponseData>();
const isMounted = ref(false);

onMounted(async () => {
  try {
    if (route.params.id) {
      const applyId = parseInt(route.params.id as string);
      const access = await store.getTokenAccess();
      apply.value = await access.getApply(applyId);
    }

    const applyTypeOptions = await backendAccess.getApplyTypeOptions('record');
    if (applyTypeOptions?.optionTypes) {
      applyTypeOptions1.value.options = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'situation')?.options || [];
      applyTypeValue1.value = applyTypeOptions1.value.options.length > 0 ? applyTypeOptions1.value.options[0].name : '';

      applyTypeOptions2.value.options = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'recordType')?.options || [];
      applyTypeValue2.value = applyTypeOptions2.value.options.length > 0 ? applyTypeOptions2.value.options[0].name : '';
    }
    isMounted.value = true;
  } catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
});

const routeName = ref('');
const isApprovalRouteSelectOpened = ref(false);

async function onFormSubmit() {
  // 回付中の場合は承認処理を行なう
  if (apply.value) {
    try {
      const access = await store.getTokenAccess();
      await access.approveApply(apply.value.id);

      if (apply.value.id) {
        const url = location.origin + '/' + router.resolve({ name: 'approve', params: { id: apply.value.id } }).href;
        await access.sendApplyMail(apply.value.id, url);
      }
    } catch (error) {
      console.error(error);
      await putErrorToDB(store.userAccount, error as Error);
      alert(error);
    }
    router.push({ name: 'dashboard' });
  }
  // 起票中の場合は承認ルート選択モーダルを表示する
  else {
    isApprovalRouteSelectOpened.value = true;
  }
}

async function onFormSubmitReject() {
  if (apply.value) {
    try {
      const access = await store.getTokenAccess();
      await access.rejectApply(apply.value.id);

      if (apply.value.id) {
        const url = location.origin + '/' + router.resolve({ name: 'approve', params: { id: apply.value.id } }).href;
        await access.sendApplyRejectedMail(apply.value.id, url);
      }
    } catch (error) {
      console.error(error);
      await putErrorToDB(store.userAccount, error as Error);
      alert(error);
    }
    router.push({ name: 'dashboard' });
  }
}

async function onRouteSubmit() {
  try {
    if (store.isLoggedIn()) {
      const access = await store.getTokenAccess();
      const applyId = await access.submitApply('record', {
        date: new Date(dateFrom.value),
        dateTimeFrom: new Date(`${dateFrom.value}T${timeFrom.value}:00`),
        timestamp: new Date(),
        options: [
          { name: 'situation', value: applyTypeValue1.value },
          { name: 'recordType', value: applyTypeValue2.value }
        ],
        reason: reason.value,
        routeName: routeName.value
      });
      if (applyId) {
        const url = location.origin + '/' + router.resolve({ name: 'approve', params: { id: applyId } }).href;
        await access.sendApplyMail(applyId, url);
      }

      router.push({ name: 'dashboard' });
    }
  } catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="申請画面" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>
    <Teleport to="body" v-if="isApprovalRouteSelectOpened">
      <ApprovalRouteSelect v-model:routeName="routeName" v-model:isOpened="isApprovalRouteSelectOpened"
        v-on:submit="onRouteSubmit"></ApprovalRouteSelect>
    </Teleport>

    <div class="row">
      <div class="col-10 bg-white p-2 shadow-sm">
        <ApplyForm v-if="isMounted" applyName="打刻" applyType="record" v-model:applyTypeValue1="applyTypeValue1"
          v-bind:applyTypeOptions1="applyTypeOptions1" v-model:applyTypeValue2="applyTypeValue2"
          v-bind:applyTypeOptions2="applyTypeOptions2" v-model:dateFrom="dateFrom" :isDateFromSpanningDay="true"
          v-model:timeFrom="timeFrom" v-model:reason="reason" :apply="apply" v-on:submit="onFormSubmit"
          v-on:submitReject="onFormSubmitReject"></ApplyForm>
      </div>
      <div class="col-2">
        <div class="row">
          <div class="p-1 d-grid">
            <RouterLink
              :to="{ name: apply?.targetUser.account !== store.userAccount ? 'approval-list' : 'apply-list', query: { approved: 'unapproved' } }"
              class="btn btn-warning btn-sm" role="button">未承認一覧</RouterLink>
          </div>
        </div>
        <div class="row">
          <div class="p-1 d-grid">
            <RouterLink
              :to="{ name: apply?.targetUser.account !== store.userAccount ? 'approval-list' : 'apply-list', query: { approved: 'rejected' } }"
              class="btn btn-warning btn-sm" role="button">否認済一覧</RouterLink>
          </div>
        </div>
        <div class="row">
          <div class="p-1 d-grid">
            <RouterLink
              :to="{ name: apply?.targetUser.account !== store.userAccount ? 'approval-list' : 'apply-list', query: { approved: 'approved' } }"
              class="btn btn-warning btn-sm" role="button">承認済一覧</RouterLink>
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