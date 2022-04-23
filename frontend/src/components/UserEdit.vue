<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSessionStore } from '@/stores/session';

import * as backendAccess from '@/BackendAccess';
import type * as apiif from 'shared/APIInterfaces';

const props = defineProps<{
  isOpened: boolean,
  userInfo: apiif.UserInfoRequestData
}>();

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'submit'): void
}>();

const route = useRoute();
const router = useRouter();
const store = useSessionStore();
const isOpened = ref(false);

const privilegeNames = ref<string[]>([]);
const workPatternNames = ref<string[]>([]);

const account = ref(route.params.account ? route.params.account as string : '');
const isNewAccount = ref(route.params.account ? false : true);

const userInfo = ref<apiif.UserInfoRequestData>(props.userInfo);

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


    if (store.isLoggedIn()) {
      const token = await store.getToken();
      if (token) {
        const access = new backendAccess.TokenAccess(token);
        const privileges = await access.getPrivileges();

        if (privileges) {
          privilegeNames.value.splice(0);
          Array.prototype.push.apply(privilegeNames.value, privileges.map(privilege => privilege.name));
        }

        const workPatterns = await access.getWorkPatterns();
        if (workPatterns) {
          workPatternNames.value.splice(0);
          Array.prototype.push.apply(workPatternNames.value, workPatterns.map(workPattern => workPattern.name));
        }
      }
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
  if (isNewAccount.value === true) {
    if (!confirm('この内容で登録しますか？')) {
      emits('update:isOpened', false);
    }
  }
  else {
    if (!confirm('この内容で修正しますか？')) {
      emits('update:isOpened', false);
    }
  }
}

async function onDeleteAccount() {
  if (confirm('本当にこの従業員を削除しますか? ※従業員を削除してもシステム上の理由により社員No IDは再利用できません')) {
    alert('従業員の削除が完了しました。');
    emits('update:isOpened', false);
  }
}

function onClose(event: Event) {
  emits('update:isOpened', false);
}

</script>

<template>
  <div class="overlay" id="user-edit">
    <div class="modal-dialog modal-xl vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">従業員設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-center m-2">
              <div class="col-6 bg-white">
                <div class="row m-1">
                  <label for="user-id" class="col-3 col-form-label">社員No</label>
                  <div class="col-9">
                    <div class="input-group">
                      <input type="text" id="user-id" class="form-control" pattern="^[0-9A-Za-z]+$"
                        title="半角英数字のみ入力可能です" v-bind:disabled="!isNewAccount" v-model="account" required />
                      <button class="btn btn-outline-secondary" type="button" id="button-addon2"
                        v-on:click="onGenerateAccount" v-show="isNewAccount"
                        title="英字で始まり数字で終わるパターンのIDを既存IDを元に自動生成します(例: USR00100)。該当するパターンの既存IDが存在しない場合は自動生成できませんので手動入力してください。">AUTO</button>
                    </div>
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-department" class="col-3 col-form-label">部門</label>
                  <div class="col-9">
                    <input type="text" class="form-control" list="user-department-list" id="user-department"
                      v-model="department" autocomplete="off" required />
                    <datalist id="user-department-list">
                      <option v-for="(item, index) in departmentList" v-bind:value="item.name"></option>
                    </datalist>
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-section" class="col-3 col-form-label">所属</label>
                  <div class="col-9">
                    <input type="text" class="form-control" list="user-section-list" id="user-section" v-model="section"
                      autocomplete="off" required />
                    <datalist id="user-section-list">
                      <option
                        v-for="(item, index) in departmentList.find(selectedDepartment => selectedDepartment.name === department)?.sections"
                        v-bind:value="item.name"></option>
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
                    <input type="text" id="user-phonetic" class="form-control" pattern="^[ァ-ンヴー|　| ]+$"
                      title="カタカナのみ入力可能です" />
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-email" class="col-4 col-form-label">メールアドレス</label>
                  <div class="col-8">
                    <input type="email" id="user-email" class="form-control" />
                  </div>
                </div>
                <!--
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
                -->
              </div>
              <div class="col-6 bg-white">
                <div class="row m-1">
                  <label for="user-privilege" class="col-3 col-form-label">権限設定</label>
                  <div class="col-9">
                    <select class="form-select" id="user-privilege">
                      <option selected disabled>権限を選択してください</option>
                      <option v-for="privilegeName in privilegeNames" :value="privilegeName">{{ privilegeName }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-privilege" class="col-3 col-form-label">勤務体系1</label>
                  <div class="col-9">
                    <select class="form-select" id="user-privilege" required>
                      <option selected disabled>勤務体系を選択してください</option>
                      <option v-for="workPatternName in workPatternNames" :value="workPatternName">
                        {{
                          workPatternName
                        }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-privilege" class="col-3 col-form-label">勤務体系2</label>
                  <div class="col-9">
                    <select class="form-select" id="user-privilege">
                      <option selected></option>
                      <option v-for="workPatternName in workPatternNames" :value="workPatternName">
                        {{
                          workPatternName
                        }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-privilege" class="col-3 col-form-label">勤務体系3</label>
                  <div class="col-9">
                    <select class="form-select" id="user-privilege">
                      <option selected></option>
                      <option v-for="workPatternName in workPatternNames" :value="workPatternName">
                        {{
                          workPatternName
                        }}
                      </option>
                    </select>
                  </div>
                </div>
                <div class="row m-1">
                  <label for="user-paid-leave-total" class="col-6 col-form-label">有給日数</label>
                  <div class="col-6">
                    <div class="input-group">
                      <input type="number" id="user-paid-leave-days" class="form-control" value="0" min="0" />
                      <span class="input-group-text">日</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
              <input type="submit" class="btn btn-warning" :value="isNewAccount ? '登録' : '修正'" />
              <input v-if="!isNewAccount" type="button" class="btn btn-danger" value="従業員削除"
                v-on:click="onDeleteAccount" />
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.vue-modal {
  position: fixed;
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 100%;
  left: 0%;
  right: 0%;
}
</style>