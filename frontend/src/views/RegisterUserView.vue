<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import Header from '@/components/Header.vue';
import ApplyForm from '@/components/ApplyForm.vue';

import * as backendAccess from '@/BackendAccess';

const route = useRoute();
const router = useRouter();
const store = useSessionStore();

function onSubmit() {
  router.push('/dashboard');
}

const departmentList = ref<{
  name: string
  sections?: {
    name: string
  }[]
}[]>([]);
const department = ref('');
const section = ref('');

backendAccess.getDepartments()
  .then((result) => {
    if (result) {
      Array.prototype.push.apply(departmentList.value, result);
    }
  });

</script>

<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-12 p-0">
        <Header
          v-bind:isAuthorized="store.isLoggedIn()"
          titleName="従業員登録画面"
          v-bind:userName="store.userName"
          customButton1="メニュー画面"
          v-on:customButton1="router.push('/dashboard')"
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
                    />
                    <button class="btn btn-outline-secondary" type="button" id="button-addon2">AUTO</button>
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
              <input type="submit" class="btn btn-warning btn-lg" value="登録" />
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