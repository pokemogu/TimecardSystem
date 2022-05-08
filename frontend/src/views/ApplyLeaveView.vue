<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';
import ApprovalRouteSelect from '@/components/ApprovalRouteSelect.vue';

import * as backendAccess from '@/BackendAccess';
import type * as apiif from 'shared/APIInterfaces';

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

console.log(route.params.id);

const applyTypeOptions1 = ref<{ type: string, options: { name: string, description: string }[] }>({ type: 'leaveType', options: [] });
const applyTypeValue1 = ref('');
const dateFrom = ref('');
const dateTo = ref('');
const reason = ref('');
const contact = ref('');
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

    const applyTypeOptions = await backendAccess.getApplyTypeOptions('leave');
    if (applyTypeOptions?.optionTypes) {
      applyTypeOptions1.value.options = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'leaveType')?.options || [];
      applyTypeValue1.value = applyTypeOptions1.value.options.length > 0 ? applyTypeOptions1.value.options[0].name : '';
      console.log(applyTypeOptions1.value)
    }
    isMounted.value = true;
  } catch (error) {
    alert(error);
  }
});

const routeName = ref('');
const isApprovalRouteSelectOpened = ref(false);

async function onFormSubmit() {
  // 回付中の場合は承認処理を行なう
  if (apply.value) {
    console.log('承認されました');
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      await access.approveApply(apply.value.id);
    }
    router.push({ name: 'dashboard' });
  }
  // 起票中の場合は承認ルート選択モーダルを表示する
  else {
    isApprovalRouteSelectOpened.value = true;
  }
}

async function onFormSubmitReject() {
  console.log('否認されました');
  if (apply.value) {
    const token = await store.getToken();
    if (token) {
      const access = new backendAccess.TokenAccess(token);
      await access.rejectApply(apply.value.id);
    }
    router.push({ name: 'dashboard' });
  }
}

async function onRouteSubmit() {
  try {
    if (store.isLoggedIn()) {
      const token = await store.getToken();
      if (token) {
        console.log(applyTypeValue1.value);
        const access = new backendAccess.TokenAccess(token);
        await access.submitApply('leave', {
          date: new Date(dateFrom.value),
          dateTimeFrom: new Date(`${dateFrom.value}T00:00:00`),
          dateTimeTo: dateTo.value !== '' ? new Date(`${dateTo.value}T23:59:59`) : undefined,
          timestamp: new Date(),
          reason: reason.value,
          contact: contact.value,
          routeName: routeName.value,
          options: [{ name: 'leaveType', value: applyTypeValue1.value }]
        });

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
        <template v-if="isMounted === true">
          <ApplyForm applyName="休暇" applyType="leave" v-model:applyTypeValue1="applyTypeValue1"
            v-bind:applyTypeOptions1="applyTypeOptions1" v-model:dateFrom="dateFrom" v-model:dateTo="dateTo"
            v-bind:isDateToOptional="true" v-model:reason="reason" v-model:contact="contact" :apply="apply"
            v-on:submit="onFormSubmit" v-on:submitReject="onFormSubmitReject">
          </ApplyForm>
        </template>
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