<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';
import ApprovalRoute from '@/components/ApprovalRoute.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

const router = useRouter();
const store = useSessionStore();

const isApprovalRouteSelected = ref(false);
const selectedRoute = ref<apiif.ApprovalRouteResposeData>({ name: '', roles: [] });

const roleNamesLinear = ref<string[]>([]);
const roleMembersLinear = ref<Record<string, string[]>>({});
const routeInfos = ref<apiif.ApprovalRouteResposeData[]>([]);
const checks = ref<Record<string, boolean>>({});

const limit = ref(10);
const offset = ref(0);

async function updateTable() {

  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
      const infos = await tokenAccess.getApprovalRoutes({ limit: limit.value + 1, offset: offset.value });
      if (infos) {
        routeInfos.value.splice(0);
        Array.prototype.push.apply(routeInfos.value, infos);

        roleMembersLinear.value = {};
        for (const route of routeInfos.value) {
          roleMembersLinear.value[route.name] = [];
          for (let i = 0; i < roleNamesLinear.value.length; i++) {

            let foundUser = false;
            for (const role of route.roles) {
              for (const user of role.users) {
                if (user.role === roleNamesLinear.value[i]) {
                  roleMembersLinear.value[route.name].push(user.name ? user.name : '');
                  foundUser = true;
                }
              }
            }
            if (!foundUser) {
              roleMembersLinear.value[route.name].push('');
            }
          }
        }
      }
    }
  }
  catch (error) {
    alert(error);
  }

}

onMounted(async () => {
  const result = await backendAccess.getApprovalRouteRoles();
  if (result) {
    roleNamesLinear.value.splice(0);
    for (const role of result) {
      Array.prototype.push.apply(roleNamesLinear.value, role.names);
    }

    updateTable();
  }
});

async function onPageBack() {
  const backTo = offset.value - limit.value;
  offset.value = backTo > 0 ? backTo : 0;
  updateTable();
}

async function onPageForward() {
  const forwardTo = offset.value + limit.value;
  offset.value = forwardTo > 0 ? forwardTo : 0;
  updateTable();
}

function onRouteClick(routeName?: string) {
  // 作成済みルートがクリックされた場合は設定更新画面、そうでなければ新規作成画面にする
  const targetRouteInfo = routeName ? routeInfos.value.find(routeInfo => routeInfo.name === routeName) : undefined;
  if (targetRouteInfo) {
    selectedRoute.value = {
      id: targetRouteInfo?.id ? targetRouteInfo?.id : undefined,
      name: targetRouteInfo?.name ? targetRouteInfo?.name : '',
      roles: targetRouteInfo?.roles ? targetRouteInfo?.roles : []
    };
  }
  else {
    selectedRoute.value = { name: '', roles: [] };
  }
  isApprovalRouteSelected.value = true;
}

async function onRouteDelete() {
  if (!confirm('チェックされた承認ルートを削除しますか?')) {
    return;
  }
  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
      for (const routeInfo of routeInfos.value) {
        if (checks.value[routeInfo.name] && routeInfo.id) {
          tokenAccess.deleteApprovalRoute(routeInfo.id);
        }
      }
    }
  }
  catch (error) {
    alert(error);
  }

  // チェックをすべてクリアする
  for (const key in checks.value) {
    checks.value[key] = false;
  }
  updateTable();
}

async function onSubmit() {
  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);

      // 承認ルートIDが作成済であれば既存ルートの更新、そうでなければ新規作成
      if (selectedRoute.value.id) {
        await tokenAccess.updateApprovalRoutes(selectedRoute.value);
      }
      else {
        await tokenAccess.addApprovalRoutes(selectedRoute.value);
      }
    }
  }
  catch (error) {
    alert(error);
  }
  updateTable();
}

function sliceDictionary(dict: Record<string, string[]>, limit: number) {
  const newDict: Record<string, string[]> = {};
  for (const key in dict) {
    if (limit <= 0) {
      break;
    }
    newDict[key] = dict[key];
    limit--;
  }
  return newDict;
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="承認ルート設定"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <Suspense>
      <Teleport to="body" v-if="isApprovalRouteSelected">
        <ApprovalRoute
          v-model:route="selectedRoute"
          v-model:isOpened="isApprovalRouteSelected"
          v-on:submit="onSubmit"
        ></ApprovalRoute>
      </Teleport>
    </Suspense>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button
          type="button"
          class="btn btn-primary"
          id="new-route"
          v-on:click="onRouteClick()"
        >新規承認ルート作成</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button
          type="button"
          class="btn btn-primary"
          id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onRouteDelete()"
        >チェックした承認ルートを削除</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <table class="table">
          <thead>
            <tr>
              <th scope="col"></th>
              <th scope="col">ルート名</th>
              <th v-for="roleName in roleNamesLinear">{{ roleName }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(roleMembers, routeName) in sliceDictionary(roleMembersLinear, limit)">
              <th scope="row">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'checkbox' + routeName"
                  v-model="checks[routeName]"
                />
              </th>
              <td>
                <button
                  type="button"
                  class="btn btn-link"
                  v-on:click="onRouteClick(routeName as string)"
                >{{ routeName }}</button>
              </td>
              <th v-for="memberName in roleMembers">{{ memberName }}</th>
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
} /* Adding !important forces the browser to overwrite the default style applied by Bootstrap */

.btn-primary {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
/*
.nav-item {
  background: navajowhite !important;
}

.nav-item:active {
  background: navajowhite !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
}

.nav-pills .nav-link:active {
  background-color: orange !important;
  border-left-color: orange !important;
  border-right-color: orange !important;
  border-top-color: orange !important;
  border-bottom-color: orange !important;
  color: black !important;
}
*/
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