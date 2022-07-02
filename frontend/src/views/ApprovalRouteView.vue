<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';
import ApprovalRoute from '@/components/ApprovalRouteEdit.vue';

import type * as apiif from 'shared/APIInterfaces';
import { putErrorToDB } from '@/ErrorDB';

const router = useRouter();
const store = useSessionStore();

const isApprovalRouteSelected = ref(false);
const selectedRoute = ref<apiif.ApprovalRouteResponseData>({ name: '' });

const routeInfos = ref<apiif.ApprovalRouteResponseData[]>([]);
const checks = ref<Record<string, boolean>>({});

const limit = ref(10);
const offset = ref(0);

async function updateTable() {

  try {
    const access = await store.getTokenAccess();
    const infos = await access.getApprovalRoutes({ limit: limit.value + 1, offset: offset.value });
    if (infos) {
      routeInfos.value.splice(0);
      Array.prototype.push.apply(routeInfos.value, infos);
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
}

onMounted(async () => {
  await updateTable();
});

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  await updateTable();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  await updateTable();
}

function onRouteClick(routeName?: string) {
  // 作成済みルートがクリックされた場合は設定更新画面、そうでなければ新規作成画面にする
  const targetRouteInfo = routeName ? routeInfos.value.find(routeInfo => routeInfo.name === routeName) : undefined;
  if (targetRouteInfo) {
    //selectedRoute.value = JSON.parse(JSON.stringify(targetRouteInfo));
    selectedRoute.value = { ...targetRouteInfo };
  }
  else {
    selectedRoute.value = { name: '' };
  }
  isApprovalRouteSelected.value = true;
}

async function onRouteDelete() {
  if (!confirm('チェックされた承認ルートを削除しますか?')) {
    return;
  }
  try {
    const access = await store.getTokenAccess();
    for (const routeInfo of routeInfos.value) {
      if (checks.value[routeInfo.name] && routeInfo.id) {
        await access.deleteApprovalRoute(routeInfo.id);
      }
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }

  // チェックをすべてクリアする
  for (const key in checks.value) {
    checks.value[key] = false;
  }
  await updateTable();
}

async function onSubmit() {
  try {
    const access = await store.getTokenAccess();

    // 承認ルートIDが作成済であれば既存ルートの更新、そうでなければ新規作成
    if (selectedRoute.value.id) {
      await access.updateApprovalRoutes(selectedRoute.value);
    }
    else {
      await access.addApprovalRoutes(selectedRoute.value);
    }
  }
  catch (error) {
    console.error(error);
    await putErrorToDB(store.userAccount, error as Error);
    alert(error);
  }
  await updateTable();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header v-bind:isAuthorized="store.isLoggedIn()" titleName="承認ルート設定" v-bind:userName="store.userName"
          customButton1="メニュー画面" v-on:customButton1="router.push({ name: 'dashboard' })"></Header>
      </div>
    </div>

    <Suspense>
      <Teleport to="body" v-if="isApprovalRouteSelected">
        <ApprovalRoute v-model:route="selectedRoute" v-model:isOpened="isApprovalRouteSelected" v-on:submit="onSubmit">
        </ApprovalRoute>
      </Teleport>
    </Suspense>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button type="button" class="btn btn-primary" id="new-route" v-on:click="onRouteClick()">新規承認ルート作成</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button type="button" class="btn btn-primary" id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onRouteDelete()">チェックした承認ルートを削除</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">ルート名</th>
              <!-- <th v-for="roleName in roleNamesLinear">{{ roleName }}</th> -->
              <th scope="col">承認者1(主)</th>
              <th scope="col">承認者1(副)</th>
              <th scope="col">承認者2(主)</th>
              <th scope="col">承認者2(副)</th>
              <th scope="col">承認者3(主)</th>
              <th scope="col">承認者3(副)</th>
              <th scope="col">決裁者</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in routeInfos">
              <th scope="row">
                <input class="form-check-input" type="checkbox" :id="'checkbox' + index" v-model="checks[item.name]" />
              </th>
              <td>
                <button type="button" class="btn btn-link" v-on:click="onRouteClick(item.name)">{{ item.name }}</button>
              </td>
              <td>{{ item.approvalLevel1MainUserName }}</td>
              <td>{{ item.approvalLevel1SubUserName }}</td>
              <td>{{ item.approvalLevel2MainUserName }}</td>
              <td>{{ item.approvalLevel2SubUserName }}</td>
              <td>{{ item.approvalLevel3MainUserName }}</td>
              <td>{{ item.approvalLevel3SubUserName }}</td>
              <td>{{ item.approvalDecisionUserName }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="7">
                <nav>
                  <ul class="pagination">
                    <li class="page-item" v-bind:class="{ disabled: offset <= 0 }">
                      <button class="page-link" v-on:click="onPageBack">
                        <span>&laquo;</span>
                      </button>
                    </li>
                    <li class="page-item" v-bind:class="{ disabled: routeInfos.length <= limit }">
                      <button class="page-link" v-on:click="onPageForward">
                        <span>&raquo;</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </td>
            </tr>
          </tfoot>
        </table>
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

.nav-tabs .nav-item .nav-link {
  background-color: navajowhite !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}

.nav-tabs .nav-item .nav-link.active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
</style>