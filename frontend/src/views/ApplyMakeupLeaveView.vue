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

const dateHolidayWork = ref(route.query.relatedDate ? route.query.relatedDate as string : '');
const dateFrom = ref('');
const timeFrom = ref('');
const timeTo = ref('');
const reason = ref('');
const apply = ref<apiif.ApplyResponseData>();
const isMounted = ref(false);

onMounted(async () => {
  try {
    if (route.params.id) {
      const applyId = parseInt(route.params.id as string);
      const token = await store.getToken();
      const access = new backendAccess.TokenAccess(token);
      apply.value = await access.getApply(applyId);
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
      const token = await store.getToken();
      if (token) {
        const access = new backendAccess.TokenAccess(token);
        await access.approveApply(apply.value.id);
      }
    }
    catch (error) {
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
      const token = await store.getToken();
      if (token) {
        const access = new backendAccess.TokenAccess(token);
        await access.rejectApply(apply.value.id);
      }
    }
    catch (error) {
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
      const token = await store.getToken();
      if (token) {
        const access = new backendAccess.TokenAccess(token);
        await access.submitApply('makeup-leave', {
          date: new Date(dateFrom.value),
          dateTimeFrom: new Date(`${dateFrom.value}T${timeFrom.value}:00`),
          dateTimeTo: new Date(`${dateFrom.value}T${timeTo.value}:00`),
          dateRelated: new Date(`${dateHolidayWork.value}T00:00:00`),
          timestamp: new Date(),
          reason: reason.value,
          routeName: routeName.value
        });

        router.push({ name: 'dashboard' });
      }
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
        <div class="row">
          <ApplyForm v-if="isMounted" applyName="代休" applyType="leave-proxy" v-model:dateOptional="dateHolidayWork"
            dateOptionalType="休出日" v-model:dateFrom="dateFrom" v-model:timeFrom="timeFrom" v-model:timeTo="timeTo"
            v-model:reason="reason" v-on:submit="onFormSubmit" v-on:submitReject="onFormSubmitReject"></ApplyForm>
        </div>
      </div>
      <div class="col-2">
        <div class="row">
          <div class="p-1 d-grid">
            <RouterLink :to="{ name: 'apply-list', query: { approved: 'unapproved' } }" class="btn btn-warning btn-sm"
              role="button">未承認一覧</RouterLink>
          </div>
        </div>
        <div class="row">
          <div class="p-1 d-grid">
            <RouterLink :to="{ name: 'apply-list', query: { approved: 'rejected' } }" class="btn btn-warning btn-sm"
              role="button">否認済一覧</RouterLink>
          </div>
        </div>
        <div class="row">
          <div class="p-1 d-grid">
            <RouterLink :to="{ name: 'apply-list', query: { approved: 'approved' } }" class="btn btn-warning btn-sm"
              role="button">承認済一覧</RouterLink>
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