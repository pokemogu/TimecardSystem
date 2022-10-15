<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';
import ApprovalRouteSelect from '@/components/ApprovalRouteSelect.vue';

import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';


const router = useRouter();
const route = useRoute();
const store = useSessionStore();

const applyTypeAndName: { [name: string]: string } = {
  'overtime': '残業',
  'lateness': '遅刻',
  'leave-early': '早退',
  'stepout': '外出',
  'holiday-work': '休日出勤',
};

const applyTypeStr = (route.params as { type?: string }).type;
const applyType = ref('');
if (!applyTypeStr) {
  router.push({ name: 'dashboard' });
}
else {
  applyType.value = applyTypeStr;
}

const dateFrom = ref('');
const timeFrom = ref('');
const timeTo = ref('');
const breakPeriodMinutes = ref<number>();
const reason = ref('');
const apply = ref<apiif.ApplyResponseData>();
const isMounted = ref(false);

onMounted(async () => {

  try {
    const access = await store.getTokenAccess();
    if (route.params.id) {
      const applyId = parseInt(route.params.id as string);
      apply.value = await access.getApply(applyId);
    }
    else {
      if (applyType.value === 'overtime') {
        breakPeriodMinutes.value = 60;
        //const defaultBreakPeriodMinutesStr = await access.getSystemConfigValue('defaultBreakPeriodMinutes');
        //if (defaultBreakPeriodMinutesStr) {
        //  breakPeriodMinutes.value = parseInt(defaultBreakPeriodMinutesStr);
        //}
      }
      if (route.params.date) {
        dateFrom.value = route.params.date as string;
      }
      if (route.params.timeFrom) {
        timeFrom.value = route.params.timeFrom as string;
      }
      if (route.params.timeTo) {
        timeTo.value = route.params.timeTo as string;
      }
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
    const access = await store.getTokenAccess();
    const applyId = await access.submitApply(applyType.value, {
      date: new Date(dateFrom.value),
      dateTimeFrom: new Date(`${dateFrom.value}T${timeFrom.value}:00`),
      dateTimeTo: new Date(`${dateFrom.value}T${timeTo.value}:00`),
      timestamp: new Date(),
      breakPeriodMinutes: breakPeriodMinutes.value,
      reason: reason.value,
      routeName: routeName.value
    });
    if (applyId) {
      const url = location.origin + '/' + router.resolve({ name: 'approve', params: { id: applyId } }).href;
      await access.sendApplyMail(applyId, url);
    }
    router.push({ name: 'dashboard' });
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
          <ApplyForm v-if="isMounted" v-bind:applyName="applyType ? applyTypeAndName[applyType] : ''"
            v-bind:applyType="applyType || ''" v-model:dateFrom="dateFrom" v-model:timeFrom="timeFrom"
            v-model:timeTo="timeTo" v-model:breakPeriodMinutes="breakPeriodMinutes" v-model:reason="reason"
            :apply="apply" v-on:submit="onFormSubmit" v-on:submitReject="onFormSubmitReject">
          </ApplyForm>
        </div>
        <!--
        <div v-if="applyType === 'holiday-work'" class="row">
          <div class="col-9"></div>
          <div class="col-3">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" value id="flexCheckChecked"
                v-model="doApplyMakeupLeave" />
              <label class="form-check-label" for="flexCheckChecked">同時に代休を申請する</label>
            </div>
          </div>
        </div>
        -->
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