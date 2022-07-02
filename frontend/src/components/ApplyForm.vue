<script setup lang="ts">

import { ref, onMounted } from 'vue';
import { format } from 'fecha';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';
import type * as apiif from 'shared/APIInterfaces';

const timeStrToMinutes = function (time: string) {
  const elems = time.split(':', 2);
  if (elems.length === 2) {
    return (parseInt(elems[0]) * 60 + parseInt(elems[1]));
  }
  else {
    return 0;
  }
}

const store = useSessionStore();

const dateType = ref('apply-date-spot');

const props = defineProps<{
  // 申請種類ごとの設定パラメーター
  applyName: string,
  applyType: string,
  applyTypeOptions1?: { type: string, options: { name: string, description: string }[] },
  applyTypeOptions2?: { type: string, options: { name: string, description: string }[] },
  dateOptionalType?: string,
  isApplyTypeOptionsDropdown?: boolean,
  isDateFromSpanningDay?: boolean,
  isDateToOptional?: boolean,

  // 申請起票時の入力値
  // 親ビューに返される
  applyTypeValue1?: string,
  applyTypeValue2?: string,
  dateOptional?: string,
  dateFrom: string,
  dateTo?: string,
  timeFrom?: string,
  timeTo?: string,
  reason?: string,
  contact?: string

  // 申請回付中の表示値
  apply?: apiif.ApplyResponseData,
}>();

const applyTypeValue1 = ref(props.applyTypeValue1 ?? '');
const applyTypeValue2 = ref(props.applyTypeValue2 ?? '');
const dateOptional = ref(props.dateOptional ?? '');
const dateFrom = ref(props.dateFrom ?? '');
const dateTo = ref(props.dateTo ?? '');
const timeFrom = ref(props.timeFrom ?? '');
const timeTo = ref(props.timeTo ?? '');
const reason = ref(props.reason ?? '');
const contact = ref(props.contact ?? '');
const approvingUsersInfo = ref<apiif.UserInfoResponseData[]>([]);

if (props.apply?.options && props.applyTypeOptions1) {
  //  console.log(props.applyTypeOptions1.find(applyTypeOption =>
  //    props.apply?.options?.some(option => option.name === applyTypeOption.name)
  //  )?.description
  //  )
}

if (props.isDateToOptional === false && props.dateTo !== undefined) {
  dateType.value = 'apply-date-period';
}

const emits = defineEmits<{
  (event: 'update:applyTypeValue1', value: string): void,
  (event: 'update:applyTypeValue2', value: string): void,
  (event: 'update:dateOptional', value: string): void,
  (event: 'update:dateFrom', value: string): void,
  (event: 'update:dateTo', value: string): void,
  (event: 'update:timeFrom', value: string): void,
  (event: 'update:timeTo', value: string): void,
  (event: 'update:reason', value: string): void,
  (event: 'update:contact', value: string): void,
  (event: 'submit'): void,
  (event: 'submitReject'): void
}>();

onMounted(async () => {
  if (props.applyTypeOptions1 && props.applyTypeOptions1.options.length > 0) {
    applyTypeValue1.value = props.applyTypeOptions1.options[0].name;
  }
  const applyTypeValue2 = ref(props.applyTypeValue2 ?? '');
  if (props.applyTypeOptions2 && props.applyTypeOptions2.options.length > 0) {
    applyTypeValue2.value = props.applyTypeOptions2.options[0].name;
  }

  if (props.apply) {
    try {
      const token = await store.getToken();
      if (token) {
        const access = new backendAccess.TokenAccess(token);
        const users = await access.getApplyCurrentApprovingUsers(props.apply.id);
        if (users) {
          Array.prototype.push.apply(approvingUsersInfo.value, users);
        }
      }
    }
    catch (error) {
      console.error(error);
      alert(error);
    }
  }

  /*
  try {
    if (store.isLoggedIn()) {

      const token = await store.getToken();
      if (token) {
        const tokenAccess = new backendAccess.TokenAccess(token);
        const userInfo = await tokenAccess.getUserInfo(store.userAccount);
        if (userInfo) {
          if (userInfo.name) {
            userName.value = userInfo.name;
          }
          if (userInfo.department) {
            userDepartment.value = userInfo.department;
          }
          if (userInfo.section) {
            userSection.value = userInfo.section;
          }
        }
      }
    }
  }
  catch (error) {
    alert(error);
  }
  */
});

function onSubmit() {
  if (props.timeFrom && props.timeTo) {
    if (timeStrToMinutes(props.timeTo) <= timeStrToMinutes(props.timeFrom)) {
      alert('時刻の期間が正しくありません。');
      return;
    }
  }

  if (dateType.value === 'apply-date-spot') {
    dateTo.value = ''
  }

  emits('update:applyTypeValue1', applyTypeValue1.value);
  emits('update:applyTypeValue2', applyTypeValue2.value);
  emits('update:dateFrom', dateFrom.value);
  emits('update:dateTo', dateTo.value);
  emits('update:dateOptional', dateOptional.value);
  emits('update:timeFrom', timeFrom.value);
  emits('update:timeTo', timeTo.value);
  emits('update:reason', reason.value);
  emits('update:contact', contact.value);
  emits('submit');
}

function onDeleteSubmit() {
  emits('submitReject');
}

</script>

<template>
  <div class="row justify-content-center">
    <div class="col-12 text-center">
      <h5>{{ props.applyName }}申請書</h5>
    </div>
  </div>
  <div class="row">
    <div class="col-2">
      <div class="row">
        <div v-if="props.apply" class="col">
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">申請</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">{{ new Date().toLocaleDateString() }}</p>
              <p class="card-title fs-6 m-0">{{ props.apply ? (props.apply.appliedUser?.name ??
                  props.apply.targetUser?.name) :
                  store.userName
              }}</p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">承認1</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">
                <span v-if="props.apply?.approvedLevel1Timestamp">
                  {{ new Date(props.apply.approvedLevel1Timestamp).toLocaleDateString() }}
                </span>
                <span>&nbsp;</span>
              </p>
              <p class="card-title fs-6 m-0">
                <span v-if="props.apply?.approvedLevel1User">
                  {{ props.apply.approvedLevel1User.name }}
                </span>
                <span>&nbsp;</span>
              </p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">承認2</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0"> <span v-if="props.apply?.approvedLevel2Timestamp">
                  {{ new Date(props.apply.approvedLevel2Timestamp).toLocaleDateString() }}
                </span>
                <span>&nbsp;</span>
              </p>
              <p class="card-title fs-6 m-0">
                <span v-if="props.apply?.approvedLevel2User">
                  {{ props.apply.approvedLevel2User.name }}
                </span>
                <span>&nbsp;</span>
              </p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">承認3</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">
                <span v-if="props.apply?.approvedLevel3Timestamp">
                  {{ new Date(props.apply.approvedLevel3Timestamp).toLocaleDateString() }}
                </span>
                <span>&nbsp;</span>
              </p>
              <p class="card-title fs-6 m-0">
                <span v-if="props.apply?.approvedLevel3User">
                  {{ props.apply.approvedLevel3User.name }}
                </span>
                <span>&nbsp;</span>
              </p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">決済</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">
                <span v-if="props.apply?.approvedDecisionTimestamp">
                  {{ new Date(props.apply.approvedDecisionTimestamp).toLocaleDateString() }}
                </span>
                <span>&nbsp;</span>
              </p>
              <p class="card-title fs-6 m-0">
                <span v-if="props.apply?.approvedDecisionUser">
                  {{ props.apply.approvedDecisionUser.name }}
                </span>
                <span>&nbsp;</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <div class="row"></div>
      <div class="row"></div>
    </div>
    <div class="col-10">
      <div class="row">
        <div class="col-6">
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">申請日</div>
            <div class="col-9 bg-white text-black border border-dark">
              {{ props.apply?.timestamp ? props.apply?.timestamp.toLocaleDateString() : new Date().toLocaleDateString()
              }}
            </div>
          </div>
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">所属部署</div>
            <div class="col-9 bg-white text-black border border-dark">
              {{ props.apply?.targetUser ? props.apply.targetUser.department : store.userDepartment }}
              {{ props.apply?.targetUser ? props.apply.targetUser.section : store.userSection }}
            </div>
          </div>
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">氏名</div>
            <div class="col-9 bg-white text-black border border-dark">
              {{ props.apply?.targetUser.name ?? store.userName }}
            </div>
          </div>
        </div>
        <!--
        <div class="col-2"></div>
        <div class="col-4">
          <div class="row">
            <div class="col">有給残</div>
            <div class="col">8.5日</div>
          </div>
          <div class="row">
            <div class="col">時間有給</div>
            <div class="col">40:00</div>
          </div>
          <div class="row">
            <div class="col">遅刻回数</div>
            <div class="col">0回</div>
          </div>
          <div class="row">
            <div class="col">遅刻時間</div>
            <div class="col">00:00</div>
          </div>
        </div>
        -->
      </div>
      <form v-on:submit="onSubmit" v-on:submit.prevent>

        <!-- オプション1 -->
        <div v-if="props.applyTypeOptions1 !== undefined" class="row">
          <div class="col-2 bg-dark text-white border border-dark">種類</div>
          <div class="col-9 bg-white text-black border border-dark p-2">

            <!-- 回付中の申請の場合 -->
            <template v-if="props.apply !== undefined">
              <template v-if="props.applyType === 'other'">
                {{ props.apply.type?.description }}
              </template>
              <template v-else>
                {{ props.applyTypeOptions1.options.find(applyTypeOption =>
                    props.apply?.options?.find(option => option.name === props.applyTypeOptions1?.type)?.value ===
                    applyTypeOption.name
                  )?.description
                }}
              </template>
            </template>

            <!-- 起票中の申請の場合 -->
            <div v-else-if="isApplyTypeOptionsDropdown !== true"
              v-for="(option, index) in props.applyTypeOptions1.options" class="form-check form-check-inline">
              <input class="form-check-input" type="radio" name="apply-type-option1"
                v-bind:id="'apply-type-option1-' + option.name" v-bind:checked="index === 0" v-model="applyTypeValue1"
                :value="option.name" />
              <label class="form-check-label" v-bind:for="'apply-type-option1-' + option.name">{{
                  option.description
              }}</label>
            </div>

            <select v-else class="form-select" v-model="applyTypeValue1" required>
              <option value disabled>申請種類を選択してください</option>
              <option v-for="(option, index) in props.applyTypeOptions1.options" :value="option.name">{{
                  option.description
              }}
              </option>
            </select>
          </div>
        </div>

        <!-- 日付オプション(休日出勤日など) -->

        <!-- 回付中の申請の場合 -->
        <div v-if="props.apply?.dateRelated !== undefined" class="row">
          <div class="col-2 bg-dark text-white border border-dark">{{ props.dateOptionalType }}</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            {{ props.apply.dateRelated.toLocaleDateString() }}
          </div>
        </div>

        <!-- 起票中の申請の場合 -->
        <div v-else-if="props.dateOptional !== undefined && props.dateOptionalType !== undefined" class="row">
          <div class="col-2 bg-dark text-white border border-dark">{{ props.dateOptionalType }}</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <input type="date" class="form-control" v-model="dateOptional" required />
            <!--
            <input type="date" class="form-control" v-bind:value="props.dateOptional" v-on:change="onChangeDateOptional"
              required />
            -->
          </div>
        </div>

        <!-- 日付 -->
        <div class="row">
          <div class="col-2 bg-dark text-white border border-dark">日付</div>
          <div class="col-9 bg-white text-black border border-dark p-2">

            <!-- 回付中の場合はそのまま値を表示する -->
            <template v-if="props.apply !== undefined">
              {{ props.apply?.dateTimeFrom.toLocaleDateString() }}
              <span
                v-if="props.apply?.dateTimeTo && (props.apply?.dateTimeTo.toLocaleDateString() !== props.apply?.dateTimeFrom.toLocaleDateString())">
                〜 {{ props.apply.dateTimeTo.toLocaleDateString() }}
              </span>
            </template>

            <!-- 起票中の場合は入力フォームを表示する -->
            <div v-else class="input-group">

              <!-- 日付の範囲指定が可能ではあるが必須ではない申請の場合は選択肢を作成する -->
              <template v-if="props.isDateToOptional === true">
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" v-model="dateType" id="apply-date-spot"
                    value="apply-date-spot" />
                  <label class="form-check-label" for="apply-date-spot">日付</label>
                </div>
                <div class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" v-model="dateType" name="apply-date-type"
                    id="apply-date-period" value="apply-date-period" />
                  <label class="form-check-label" for="apply-date-period">期間</label>
                </div>
              </template>

              <!-- 開始日付の入力フォーム -->
              <input type="date" class="form-control" v-model="dateFrom" required />

              <!-- 終了日付の入力フォーム -->
              <template v-if="props.dateTo !== undefined && dateType === 'apply-date-period'">
                <span class="input-group-text">〜</span>
                <input type="date" class="form-control" v-model="dateTo" required />
              </template>

            </div>
          </div>
        </div>

        <!-- 時刻 -->
        <div class="row" v-if="props.timeFrom !== undefined">
          <div class="col-2 bg-dark text-white border border-dark">時刻</div>
          <div class="col-9 bg-white text-black border border-dark p-2">

            <!-- オプション2 -->
            <template v-if="props.applyTypeOptions2 !== undefined">
              <span v-if="props.apply !== undefined">
                {{ props.applyTypeOptions2.options.find(applyTypeOption =>
                    props.apply?.options?.find(option => option.name === props.applyTypeOptions2?.type)?.value ===
                    applyTypeOption.name
                  )?.description
                }}
              </span>
              <div v-else class="input-group">
                <div v-for="(option, index) in props.applyTypeOptions2.options" class="form-check form-check-inline">
                  <input class="form-check-input" type="radio" name="apply-type-option2"
                    v-bind:id="'apply-type-option2-' + option.name" v-bind:value="option.name"
                    v-bind:checked="index === 0" v-model="applyTypeValue2" :value="option.name" />
                  <label class="form-check-label" v-bind:for="'apply-type-option2-' + option.name">{{
                      option.description
                  }}</label>
                </div>
              </div>
            </template>

            <!-- 時刻 -->
            <template v-if="props.timeFrom !== undefined">

              <!-- 回付中の場合はそのまま値を表示する -->
              <template v-if="props.apply !== undefined">
                {{ format(props.apply?.dateTimeFrom, 'shortTime') }}
                <span v-if="props.apply?.dateTimeTo"> 〜 {{ format(props.apply?.dateTimeTo, 'shortTime') }}</span>
              </template>

              <!-- 起票中の場合は入力フォームを表示する -->
              <template v-else>
                <div class="input-group">
                  <input v-model="timeFrom" type="time" class="form-control" required />
                  <template v-if="props.timeTo !== undefined">
                    <span class="input-group-text">〜</span>
                    <input type="time" class="form-control" v-model="timeTo" required />
                  </template>
                </div>
              </template>

            </template>

          </div>
        </div>

        <!-- 理由 -->
        <div class="row" v-if="props.reason !== undefined">
          <div class="col-2 bg-dark text-white border border-dark">理由</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <span v-if="props.apply?.reason !== undefined">{{ props.apply?.reason }}</span>
            <textarea v-else class="form-control" rows="3" cols="32" v-model="reason"
              v-bind:required="props.applyType !== 'leave' || (props.applyType === 'leave' && applyTypeValue1 !== 'normal')"></textarea>
          </div>
        </div>

        <!-- 連絡先 -->
        <div v-if="props.contact !== undefined" class="row">
          <div class="col-2 bg-dark text-white border border-dark">連絡先</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <span v-if="props.apply?.contact !== undefined">{{ props.apply?.contact }}</span>
            <textarea v-else class="form-control" rows="3" cols="32" v-model="contact"></textarea>
          </div>
        </div>

        <!-- ボタン -->
        <div class="row g-2 mt-2">

          <!-- 起票中の場合は申請ボタンを表示する -->
          <div v-if="props.apply === undefined" class="d-grid col gap-2">
            <input type="submit" class="btn btn-warning btn-lg" value="申請" />
          </div>

          <!-- 回付中の場合は自分が承認者として回付されている状態であれば承認あるいは否認ボタンを表示する -->
          <!-- ただし回付中に誰かが否認済みであればボタンは表示しない -->
          <div v-else-if="apply?.isApproved === true" class="alert alert-primary" role="alert">承認済</div>
          <div v-else-if="apply?.isApproved === false" class="alert alert-danger" role="alert">否認済</div>
          <template
            v-else-if="apply?.isApproved !== false && approvingUsersInfo.length > 0 && approvingUsersInfo.some(userInfo => userInfo.account === store.userAccount) === true">
            <input type="submit" class="btn btn-warning btn-lg" value="承認" />
            <input type="button" class="btn btn-danger btn-lg" v-on:click="onDeleteSubmit" value="否認" />
          </template>
        </div>

      </form>
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

<style scoped>
.form-width-10 {
  width: 10%;
}
</style>