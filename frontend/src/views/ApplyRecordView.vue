<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';
import ApprovalRouteSelect from '@/components/ApprovalRouteSelect.vue';

import * as backendAccess from '@/BackendAccess';
import type * as apiif from 'shared/APIInterfaces';

const router = useRouter();
const route = useRoute();
const store = useSessionStore();

// 権限チェック

const applyTypeOptions1 = ref<{ name: string, description: string }[]>([]);
const applyTypeValue1 = ref('');
const applyTypeOptions2 = ref<{ name: string, description: string }[]>([]);
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
      const token = await store.getToken();
      const access = new backendAccess.TokenAccess(token);
      apply.value = await access.getApply(applyId);
      console.log(apply.value);
    }

    const applyTypeOptions = await backendAccess.getApplyTypeOptions('record');
    if (applyTypeOptions?.optionTypes) {
      applyTypeOptions1.value = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'situation')?.options || [];
      applyTypeValue1.value = applyTypeOptions1.value.length > 0 ? applyTypeOptions1.value[0].name : '';

      applyTypeOptions2.value = applyTypeOptions?.optionTypes
        .find(optionType => optionType.name === 'recordType')?.options || [];
      applyTypeValue2.value = applyTypeOptions2.value.length > 0 ? applyTypeOptions2.value[0].name : '';
    }

    isMounted.value = true;

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
        const applyId = await access.submitApply('record', {
          date: dateFrom.value,
          dateTimeFrom: new Date(`${dateFrom.value}T${timeFrom.value}:00`).toISOString(),
          timestamp: new Date().toISOString(),
          options: [
            { name: 'situation', value: applyTypeValue1.value },
            { name: 'recordType', value: applyTypeValue2.value }
          ],
          reason: reason.value,
          route: routeName.value
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
          <ApplyForm applyName="打刻" applyType="record" v-model:applyTypeValue1="applyTypeValue1"
            v-bind:applyTypeOptions1="applyTypeOptions1" v-model:applyTypeValue2="applyTypeValue2"
            v-bind:applyTypeOptions2="applyTypeOptions2" v-model:dateFrom="dateFrom" :isDateFromSpanningDay="true"
            v-model:timeFrom="timeFrom" v-model:reason="reason" :apply="apply" v-on:submit="onFormSubmit"></ApplyForm>
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