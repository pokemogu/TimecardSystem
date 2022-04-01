<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, RouterLink } from 'vue-router';
import { useSessionStore } from '@/stores/session';
import Header from '@/components/Header.vue';

import type * as apiif from 'shared/APIInterfaces';
import * as backendAccess from '@/BackendAccess';

import PrivilegeEdit from '@/components/PrivilegeEdit.vue';

const router = useRouter();
const store = useSessionStore();

const isModalOpened = ref(false);
const selectedPrivilege = ref<apiif.PrivilegeResponseData>({ name: '' });
const privilegeInfos = ref<apiif.PrivilegeResponseData[]>([]);
const applyPrivilegeInfos = ref<{ privilege: number, applyPrivilege: apiif.ApplyPrivilegeResponseData[] }[]>([]);
const applyPrivilegeColumns = ref<string[]>([]);
const checks = ref<Record<number, boolean>>({});

const limit = ref(10);
const offset = ref(0);

async function updateTable() {

  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
      const infos = await tokenAccess.getPrivileges({ limit: limit.value + 1, offset: offset.value });
      if (infos) {
        privilegeInfos.value.splice(0);
        Array.prototype.push.apply(privilegeInfos.value, infos);

        applyPrivilegeInfos.value.splice(0);
        applyPrivilegeColumns.value.splice(0);
        for (const info of infos) {
          if (info.id) {
            const infos2 = await tokenAccess.getApplyPrivilege(info.id);
            if (infos2) {
              applyPrivilegeInfos.value.push({
                privilege: info.id,
                applyPrivilege: infos2.filter(info => info.isSystemType === true)
              })
            }
          }
        }
        applyPrivilegeColumns.value = applyPrivilegeInfos.value[0].applyPrivilege.map(priv => priv.applyTypeDescription);
        console.log(applyPrivilegeInfos.value);
      }
    }
  }
  catch (error) {
    alert(error);
  }

}

onMounted(async () => {
  updateTable();
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

async function onPrivilegeClick(privilegeId?: number) {

  if (privilegeId) {
    selectedPrivilege.value.id = privilegeId;
  }
  else {
    selectedPrivilege.value = { name: '' };
  }
  isModalOpened.value = true;
}

async function onWorkPatternDelete() {
  if (!confirm('チェックされた勤務体系を削除しますか? (※従業員が1人でも使用している勤務体系は削除できず、サーバーエラーが発生します)')) {
    return;
  }
  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);
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

async function onWorkPatternSubmit() {
  console.log(selectedPrivilege.value);

  try {
    const token = await store.getToken();
    if (token) {
      const tokenAccess = new backendAccess.TokenAccess(token);

      // 承認ルートIDが作成済であれば既存ルートの更新、そうでなければ新規作成
      if (selectedPrivilege.value.id) {
        await tokenAccess.updatePrivilege(selectedPrivilege.value);
      }
      else {
        await tokenAccess.addPrivilege(selectedPrivilege.value);
      }
    }
  }
  catch (error) {
    alert(error);
  }
  updateTable();
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="勤務体系設定"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <Teleport to="body" v-if="isModalOpened">
      <PrivilegeEdit v-model:isOpened="isModalOpened"></PrivilegeEdit>
    </Teleport>

    <div class="row justify-content-start p-2">
      <div class="d-grid gap-2 col-3">
        <button
          type="button"
          class="btn btn-primary"
          id="new-route"
          v-on:click="onPrivilegeClick()"
        >新規勤務体系作成</button>
      </div>
      <div class="d-grid gap-2 col-4">
        <button
          type="button"
          class="btn btn-primary"
          id="export"
          v-bind:disabled="Object.values(checks).every(check => check === false)"
          v-on:click="onWorkPatternDelete()"
        >チェックした勤務体系を削除</button>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-12 bg-white shadow-sm">
        <table class="table table-bordered">
          <thead>
            <tr>
              <th rowspan="2"></th>
              <th rowspan="2" class="text-center">権限名称</th>
              <th rowspan="2" class="text-center vertical">PC使用</th>
              <th :colspan="applyPrivilegeColumns.length" class="text-center">申請</th>
              <th rowspan="2" scope="col" class="text-center vertical">承認</th>
              <th rowspan="2" scope="col" class="text-center vertical">勤怠照会</th>
              <th rowspan="2" scope="col" class="text-center vertical">工程管理</th>
              <th rowspan="2" scope="col" class="text-center vertical">権限設定</th>
              <th rowspan="2" scope="col" class="text-center vertical">勤務体系</th>
              <th rowspan="2" scope="col" class="text-center vertical">QR発行</th>
              <th rowspan="2" scope="col" class="text-center vertical">従業員登録</th>
              <th rowspan="2" scope="col" class="text-center vertical">端末登録</th>
            </tr>
            <tr>
              <th
                scope="col"
                class="text-center vertical"
                v-for="(item, index) in applyPrivilegeColumns"
              >{{ item }}</th>
              <!--
              <th scope="col" class="text-center vertical">有給</th>
              <th scope="col" class="text-center vertical">半休</th>
              <th scope="col" class="text-center vertical">代休</th>
              <th scope="col" class="text-center vertical">慶弔休</th>
              <th scope="col" class="text-center vertical">措置休</th>
              <th scope="col" class="text-center vertical">早出残業</th>
              <th scope="col" class="text-center vertical">遅刻</th>
              <th scope="col" class="text-center vertical">早退</th>
              -->
              <!-- <th v-for="roleName in roleNamesLinear">{{ roleName }}</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-for="(privilege, index) in privilegeInfos">
              <th scope="row">
                <input
                  class="form-check-input"
                  type="checkbox"
                  :id="'checkbox' + index"
                  v-model="checks[privilege.id || 0]"
                />
              </th>
              <td>
                <button
                  type="button"
                  class="btn btn-link"
                  v-on:click="onPrivilegeClick(privilege.id)"
                >
                  {{
                    privilege.name
                  }}
                </button>
              </td>
              <td class="text-center">
                <span v-if="privilege.recordByLogin">&check;</span>
              </td>

              <td
                class="text-center"
                v-for="(item, index) in applyPrivilegeInfos.find(priv => priv.privilege === privilege.id)?.applyPrivilege"
              >
                <span v-if="item.permitted === true">&check;</span>
              </td>
              <!--
              <td class="text-center">
                <span v-if="privilege.applyLeave">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyHalfDayLeave">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyMakeupLeave">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyMourningLeave">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyMeasureLeave">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyOvertime">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyLate">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.applyEarly">&check;</span>
              </td>
              -->
              <td class="text-center">
                <span v-if="privilege.approve">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.viewRecord === undefined || privilege.viewRecord === null">本人</span>
                <span v-else-if="privilege.viewRecord === false">部署</span>
                <span v-else-if="privilege.viewRecord === true">全社</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.viewRecordPerDevice">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.configurePrivilege">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.configureWorkPattern">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.issueQr">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.registerUser">&check;</span>
              </td>
              <td class="text-center">
                <span v-if="privilege.registerDevice">&check;</span>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="20">
                <nav>
                  <ul class="pagination">
                    <li class="page-item" v-bind:class="{ disabled: offset <= 0 }">
                      <button class="page-link" v-on:click="onPageBack">
                        <span>&laquo;</span>
                      </button>
                    </li>
                    <li
                      class="page-item"
                      v-bind:class="{ disabled: privilegeInfos.length <= limit }"
                    >
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
<style scoped>
.vertical {
  writing-mode: vertical-rl;
  text-orientation: upright;
}
</style>