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

const applyTypeOptions1 = ref<{ type: string, options: { name: string, description: string }[] }>({ type: 'workPattern', options: [] });
const applyTypeValue1 = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const timeFrom = ref('');
const timeTo = ref('');
const contact = ref('');
const apply = ref<apiif.ApplyResponseData>();
const isMounted = ref(false);

const routeName = ref('');
const isApprovalRouteSelectOpened = ref(false);

onMounted(async () => {
  try {

    const access = await store.getTokenAccess();
    const workPatterns = await access.getWorkPatterns();
    if (workPatterns) {
      applyTypeOptions1.value.options.splice(0);

      const userInfo = await access.getUserInfo(store.userAccount);
      if (userInfo) {
        if (userInfo.defaultWorkPatternName) {
          applyTypeOptions1.value.options.push({ name: userInfo.defaultWorkPatternName, description: userInfo.defaultWorkPatternName });
        }
        if (userInfo.optional1WorkPatternName) {
          applyTypeOptions1.value.options.push({ name: userInfo.optional1WorkPatternName, description: userInfo.optional1WorkPatternName });
        }
        if (userInfo.optional2WorkPatternName) {
          applyTypeOptions1.value.options.push({ name: userInfo.optional2WorkPatternName, description: userInfo.optional2WorkPatternName });
        }
      }
    }

    if (route.params.id) {
      const applyId = parseInt(route.params.id as string);
      apply.value = await access.getApply(applyId);
      if (apply.value?.workPattern) {
        //console.log(apply.value.workPattern);
        apply.value.options = [{ name: 'workPattern', value: apply.value.workPattern }];
        applyTypeValue1.value = apply.value.workPattern;
      }
    }

    isMounted.value = true;
  } catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
});

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

const doApplyMakeupLeave = ref(true);

async function onRouteSubmit() {
  try {
    if (dateTo.value === '') {
      dateTo.value = dateFrom.value;
    }
    const access = await store.getTokenAccess();
    const applyId = await access.submitApply('holiday-work', {
      date: new Date(dateFrom.value),
      dateTimeFrom: new Date(`${dateFrom.value}T00:00:00`),
      timestamp: new Date(),
      contact: contact.value,
      routeName: routeName.value,
      workPattern: applyTypeValue1.value
    });
    if (applyId) {
      const url = location.origin + '/' + router.resolve({ name: 'approve', params: { id: applyId } }).href;
      await access.sendApplyMail(applyId, url);
    }

    if (doApplyMakeupLeave.value === true) {
      router.push({ name: 'apply-makeup-leave', query: { relatedDate: dateFrom.value } });
    }
    else {
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
        <div class="row">
          <ApplyForm v-if="isMounted" applyName="休日出勤" applyType="hoilday-work" :isApplyTypeOptionsDropdown="true"
            v-model:applyTypeValue1="applyTypeValue1" v-bind:applyTypeOptions1="applyTypeOptions1"
            v-model:dateFrom="dateFrom" v-model:dateTo="dateTo" v-bind:isDateToOptional="true" v-model:contact="contact"
            :apply="apply" v-on:submit="onFormSubmit" v-on:submitReject="onFormSubmitReject"> </ApplyForm>
          <!-- v-model:timeFrom="timeFrom" v-model:timeTo="timeTo" -->
          <div class="col-9"></div>
          <div class="col-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value id="flexCheckChecked"
                v-model="doApplyMakeupLeave" />
              <label class="form-check-label" for="flexCheckChecked">同時に代休を申請する</label>
            </div>
          </div>
        </div>
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