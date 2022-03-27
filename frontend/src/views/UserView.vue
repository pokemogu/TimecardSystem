<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';

import * as backendAccess from '@/BackendAccess';

const route = useRoute();
const router = useRouter();
const store = useSessionStore();

console.log();

const account = ref(route.params.account ? route.params.account as string : '');
const isExistingAccount = ref(route.params.account ? true : false);

const departmentList = ref<{
  name: string
  sections?: {
    name: string
  }[]
}[]>([]);
const department = ref('');
const section = ref('');

let candidateCycle = 0;
const receivedCandidates: string[] = [];

onMounted(async () => {

  try {
    const result = await backendAccess.getDepartments();
    if (result) {
      Array.prototype.push.apply(departmentList.value, result);
    }
  }
  catch (error) {
    alert(error);
  }
});

async function onGenerateAccount() {

  if (receivedCandidates.length < 1) {
    const candidates = await backendAccess.getUserAccountCandidates();
    if (candidates) {
      Array.prototype.push.apply(receivedCandidates, candidates);
    }
  }

  if (receivedCandidates.length > 0) {
    account.value = receivedCandidates[candidateCycle];
    candidateCycle = ((candidateCycle + 1) >= receivedCandidates.length) ? 0 : (candidateCycle + 1)
  }
}

async function onSubmit() {
  if (isExistingAccount.value === true) {
    if (confirm('この内容で修正しますか？')) {
    }
  }
  else {
    if (confirm('この内容で登録しますか？')) {
    }
  }

  router.push({ name: 'admin-users' });
}

async function onDeleteAccount() {
  if (confirm('本当にこの従業員を削除しますか? ※従業員を削除してもシステム上の理由により社員No IDは再利用できません')) {
    alert('従業員の削除が完了しました。');
    router.push({ name: 'admin-users' });
  }
}

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          :titleName="isExistingAccount ? '従業員照会画面' : '従業員登録画面'"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push({ name: 'dashboard' })"
        ></Header>
      </div>
    </div>

    <div class="row justify-content-center m-2">
      <div class="col-10 bg-white shadow-sm">
        <form v-on:submit="onSubmit" v-on:submit.prevent>
          <div class="row justify-content-center m-2">
            <div class="col-6 bg-white">
              <div class="row m-1">
                <label for="user-id" class="col-3 col-form-label">社員No</label>
                <div class="col-9">
                  <div class="input-group">
                    <input
                      type="text"
                      id="user-id"
                      class="form-control"
                      pattern="^[0-9A-Za-z]+$"
                      title="半角英数字のみ入力可能です"
                      v-bind:disabled="isExistingAccount"
                      v-model="account"
                      required
                    />
                    <button
                      class="btn btn-outline-secondary"
                      type="button"
                      id="button-addon2"
                      v-on:click="onGenerateAccount"
                      v-show="!isExistingAccount"
                      title="英字で始まり数字で終わるパターンのIDを既存IDを元に自動生成します(例: USR00100)。該当するパターンの既存IDが存在しない場合は自動生成できませんので手動入力してください。"
                    >AUTO</button>
                  </div>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-department" class="col-3 col-form-label">部門</label>
                <div class="col-9">
                  <input
                    type="text"
                    class="form-control"
                    list="user-department-list"
                    id="user-department"
                    v-model="department"
                    required
                  />
                  <datalist id="user-department-list">
                    <option v-for="(item, index) in departmentList" v-bind:value="item.name"></option>
                  </datalist>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-section" class="col-3 col-form-label">所属</label>
                <div class="col-9">
                  <input
                    type="text"
                    class="form-control"
                    list="user-section-list"
                    id="user-section"
                    v-model="section"
                    required
                  />
                  <datalist id="user-section-list">
                    <option
                      v-for="(item, index) in departmentList.find(selectedDepartment => selectedDepartment.name === department)?.sections"
                      v-bind:value="item.name"
                    ></option>
                  </datalist>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-name" class="col-3 col-form-label">氏名</label>
                <div class="col-9">
                  <input type="text" id="user-name" class="form-control" required />
                </div>
              </div>
              <div class="row m-1">
                <label for="user-phonetic" class="col-3 col-form-label">フリガナ</label>
                <div class="col-9">
                  <input
                    type="text"
                    id="user-phonetic"
                    class="form-control"
                    pattern="^[ァ-ンヴー|　| ]+$"
                    title="カタカナのみ入力可能です"
                    required
                  />
                </div>
              </div>
              <div class="row m-1">
                <div class="col-3">明細</div>
                <div class="col-9">
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="user-wage-detail"
                      id="user-wage-detail-web"
                      value="web"
                      checked
                    />
                    <label class="form-check-label" for="user-wage-detail-web">WEB</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="user-wage-detail"
                      id="user-wage-detail-paper"
                      value="paper"
                    />
                    <label class="form-check-label" for="user-wage-detail-paper">紙</label>
                  </div>
                  <div class="form-check form-check-inline">
                    <input
                      class="form-check-input"
                      type="radio"
                      name="user-wage-detail"
                      id="user-wage-detail-notregistered"
                      value="notregsitered"
                    />
                    <label class="form-check-label" for="user-wage-detail-notregistered">未登録</label>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-6 bg-white">
              <div class="row m-1">
                <label for="user-privilege" class="col-3 col-form-label">権限設定</label>
                <div class="col-9">
                  <select class="form-select" id="user-privilege">
                    <option selected disabled>権限を選択してください</option>
                    <option value="1">パート</option>
                    <option value="2">工場社員</option>
                    <option value="3">事務社員</option>
                  </select>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-privilege" class="col-3 col-form-label">勤務体系1</label>
                <div class="col-9">
                  <select class="form-select" id="user-privilege">
                    <option selected disabled>勤務体系を選択してください</option>
                    <option value="1">パート</option>
                    <option value="2">工場社員</option>
                    <option value="3">事務社員</option>
                  </select>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-privilege" class="col-3 col-form-label">勤務体系2</label>
                <div class="col-9">
                  <select class="form-select" id="user-privilege">
                    <option selected disabled>勤務体系を選択してください</option>
                    <option value="1">パート</option>
                    <option value="2">工場社員</option>
                    <option value="3">事務社員</option>
                  </select>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-privilege" class="col-3 col-form-label">勤務体系3</label>
                <div class="col-9">
                  <select class="form-select" id="user-privilege">
                    <option selected disabled>勤務体系を選択してください</option>
                    <option value="1">パート</option>
                    <option value="2">工場社員</option>
                    <option value="3">事務社員</option>
                  </select>
                </div>
              </div>
              <div class="row m-1">
                <label for="user-paid-leave-total" class="col-6 col-form-label">有給日数</label>
                <div class="col-6">
                  <div class="input-group">
                    <input
                      type="number"
                      id="user-paid-leave-days"
                      class="form-control"
                      value="0"
                      min="0"
                    />
                    <span class="input-group-text">日</span>
                  </div>
                </div>
              </div>
              <!--
              <div class="row m-1">
                <label for="user-paid-leave-hours" class="col-6 col-form-label">時間有給</label>
                <div class="col-6">
                  <div class="input-group">
                    <input
                      type="number"
                      id="user-paid-leave-hours"
                      class="form-control"
                      value="0"
                      min="0"
                    />
                    <span class="input-group-text">時間</span>
                  </div>
                </div>
              </div>
              -->
            </div>
          </div>
          <div class="row justify-content-center m-1">
            <div class="d-grid col-6 gap-2">
              <input
                type="submit"
                class="btn btn-warning btn-lg"
                :value="isExistingAccount ? '修正' : '登録'"
              />
            </div>
            <div class="d-grid col-2 gap-2" v-if="isExistingAccount">
              <input
                type="button"
                class="btn btn-danger btn-lg"
                value="従業員削除"
                v-on:click="onDeleteAccount"
              />
            </div>
          </div>
        </form>
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
</style>