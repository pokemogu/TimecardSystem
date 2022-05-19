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

const route = useRoute();
const router = useRouter();
const store = useSessionStore();

const applyTypeOptions1 = ref<{ type: string, options: { name: string, description: string }[] }>({ type: 'applyType', options: [] });
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

    if (route.params.id) {
      const applyId = parseInt(route.params.id as string);
      const token = await store.getToken();
      const access = new backendAccess.TokenAccess(token);
      apply.value = await access.getApply(applyId);
      console.log(apply.value);
    }

    const applyTypes = await backendAccess.getApplyTypes();
    if (applyTypes) {
      const customApplyTypes = applyTypes.filter(applyType => applyType.isSystemType !== true);
      if (customApplyTypes) {
        applyTypeOptions1.value.options.splice(0);
        Array.prototype.push.apply(
          applyTypeOptions1.value.options,
          customApplyTypes.map(applyType => {
            return { name: applyType.name, description: applyType.description };
          })
        );
      }
    }
    isMounted.value = true;
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
});

async function onFormSubmit() {
  isApprovalRouteSelectOpened.value = true;
}

async function onRouteSubmit() {
  try {
    if (store.isLoggedIn()) {
      const token = await store.getToken();
      if (token) {
        if (dateTo.value === '') {
          dateTo.value = dateFrom.value;
        }
        const access = new backendAccess.TokenAccess(token);
        await access.submitApply(applyTypeValue1.value, {
          date: new Date(dateFrom.value),
          dateTimeFrom: new Date(`${dateFrom.value}T${timeFrom.value}:00`),
          dateTimeTo: new Date(`${dateTo.value}T${timeTo.value}:59`),
          timestamp: new Date(),
          contact: contact.value,
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
    <template v-if="isMounted === true">
      <Teleport to="body" v-if="isApprovalRouteSelectOpened">
        <ApprovalRouteSelect v-model:routeName="routeName" v-model:isOpened="isApprovalRouteSelectOpened"
          v-on:submit="onRouteSubmit"></ApprovalRouteSelect>
      </Teleport>
    </template>

    <div class="row">
      <div class="col-10 bg-white p-2 shadow-sm">
        <div class="row">
          <ApplyForm applyName="その他申請" applyType="other" :isApplyTypeOptionsDropdown="true"
            v-model:applyTypeValue1="applyTypeValue1" v-bind:applyTypeOptions1="applyTypeOptions1"
            v-model:dateFrom="dateFrom" v-model:dateTo="dateTo" v-model:timeFrom="timeFrom" v-model:timeTo="timeTo"
            v-bind:isDateToOptional="true" v-model:contact="contact" :apply="apply" v-on:submit="onFormSubmit">
          </ApplyForm>
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