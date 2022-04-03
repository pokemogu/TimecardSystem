<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { useSessionStore } from '@/stores/session';
import * as backendAccess from '@/BackendAccess';

const timeStrToMinutes = function (time: string) {
  const elems = time.split(':', 2);
  if (elems.length === 2) {
    return (parseInt(elems[0]) * 60 + parseInt(elems[1]));
  }
  else {
    return 0;
  }
}

const route = useRoute();
const store = useSessionStore();

const dateType = ref('apply-date-spot');
const userName = ref('');
const userDepartment = ref('');
const userSection = ref('');

interface ApplyFormProps {
  applyName: string,
  applyType: string,
  applyTypeValue1?: string,
  applyTypeOptions1?: { name: string, description: string }[],
  applyTypeValue2?: string,
  applyTypeOptions2?: { name: string, description: string }[],
  isApplyTypeOptionsDropdown?: boolean,
  dateOptional?: string,
  dateOptionalType?: string,
  dateFrom: string,
  isDateFromSpanningDay?: boolean,
  dateTo?: string,
  isDateToOptional?: boolean,
  timeFrom?: string,
  timeTo?: string,
  reason?: string,
  contact?: string
}
const props = defineProps<ApplyFormProps>();

const applyTypeValue1 = ref(props.applyTypeValue1 ?? '');
const dateFrom = ref(props.dateFrom ?? '');
const dateTo = ref(props.dateTo ?? '');
const timeFrom = ref(props.timeFrom ?? '');
const timeTo = ref(props.timeTo ?? '');
const reason = ref(props.reason ?? '');
const contact = ref(props.contact ?? '');

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
  (event: 'submit'): void
}>();

onMounted(async () => {
  if (props.applyTypeOptions1 && props.applyTypeOptions1.length > 0) {
    applyTypeValue1.value = props.applyTypeOptions1[0].name;
  }
  const applyTypeValue2 = ref(props.applyTypeValue2 ?? '');
  if (props.applyTypeOptions2 && props.applyTypeOptions2.length > 0) {
    applyTypeValue2.value = props.applyTypeOptions2[0].name;
  }

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
});

function onChangeApplyType1(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:applyTypeValue1', value);
}

function onChangeApplyType2(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:applyTypeValue2', value);
}

function onChangeDateOptional(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:dateOptional', value);
}

function onChangeDateFrom(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:dateFrom', value);
}

function onChangeDateTo(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:dateTo', value);
}

function onChangeTimeFrom(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:timeFrom', value);
}

function onChangeTimeTo(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:timeTo', value);
}

function onChangeReason(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:reason', value);
}

function onChangeContact(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:contact', value);
}

function onSubmit() {
  if (props.timeFrom && props.timeTo) {
    if (timeStrToMinutes(props.timeTo) <= timeStrToMinutes(props.timeFrom)) {
      alert('時刻の期間が正しくありません。');
      return;
    }
  }

  emits('update:applyTypeValue1', applyTypeValue1.value);
  emits('submit');
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
        <div class="col">
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">申請</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">{{ new Date().toLocaleDateString() }}</p>
              <p class="card-title fs-6 m-0">{{ userName }}</p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">承認1</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">&nbsp;</p>
              <p class="card-title fs-6 m-0">&nbsp;</p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">承認2</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">&nbsp;</p>
              <p class="card-title fs-6 m-0">&nbsp;</p>
            </div>
          </div>
          <div class="card border-dark">
            <div class="card-header m-0 p-1 bg-dark text-white">決済</div>
            <div class="card-body m-0 p-1">
              <p class="card-text fs-6 m-0">&nbsp;</p>
              <p class="card-title fs-6 m-0">&nbsp;</p>
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
            <div
              class="col-9 bg-white text-black border border-dark"
            >{{ new Date().toLocaleDateString() }}</div>
          </div>
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">所属部署</div>
            <div
              class="col-9 bg-white text-black border border-dark"
            >{{ userDepartment }} {{ userSection }}</div>
          </div>
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">氏名</div>
            <div class="col-9 bg-white text-black border border-dark">{{ userName }}</div>
          </div>
        </div>
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
      </div>
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div v-if="props.applyTypeOptions1" class="row">
          <div class="col-2 bg-dark text-white border border-dark">種類</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <div
              v-if="isApplyTypeOptionsDropdown !== true"
              v-for="(option, index) in props.applyTypeOptions1"
              class="form-check form-check-inline"
            >
              <input
                class="form-check-input"
                type="radio"
                name="apply-type-option1"
                v-bind:id="'apply-type-option1-' + option.name"
                v-bind:value="option.name"
                v-bind:checked="index === 0"
                v-on:change="onChangeApplyType1"
                v-model="applyTypeValue1"
              />
              <label
                class="form-check-label"
                v-bind:for="'apply-type-option1-' + option.name"
              >{{ option.description }}</label>
            </div>

            <select v-else class="form-select" v-model="applyTypeValue1" required>
              <option value disabled>申請種類を選択してください</option>
              <option
                v-for="(option, index) in props.applyTypeOptions1"
                :value="option.name"
              >{{ option.description }}</option>
            </select>
          </div>
        </div>
        <div
          v-if="props.dateOptional !== undefined && props.dateOptionalType !== undefined"
          class="row"
        >
          <div class="col-2 bg-dark text-white border border-dark">{{ props.dateOptionalType }}</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <input
              type="date"
              class="form-control"
              v-bind:value="props.dateOptional"
              v-on:change="onChangeDateOptional"
              required
            />
          </div>
        </div>
        <div class="row">
          <div class="col-2 bg-dark text-white border border-dark">日付</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <div class="input-group">
              <div v-if="props.isDateToOptional === true" class="form-check form-check-inline">
                <input
                  class="form-check-input"
                  type="radio"
                  v-model="dateType"
                  id="apply-date-spot"
                  value="apply-date-spot"
                />
                <label class="form-check-label" for="apply-date-spot">日付</label>
              </div>
              <div v-if="props.isDateToOptional === true" class="form-check form-check-inline">
                <input
                  class="form-check-input"
                  type="radio"
                  v-model="dateType"
                  name="apply-date-type"
                  id="apply-date-period"
                  value="apply-date-period"
                />
                <label class="form-check-label" for="apply-date-period">期間</label>
              </div>
              <select class="form-select" v-if="isDateFromSpanningDay === true">
                <option :value="false" selected>当日</option>
                <option :value="true">翌日</option>
              </select>
              <input
                type="date"
                class="form-control"
                v-bind:value="props.dateFrom"
                v-on:change="onChangeDateFrom"
                required
              />
              <span
                v-if="props.dateTo !== undefined && dateType === 'apply-date-period'"
                class="input-group-text"
              >〜</span>
              <input
                v-if="props.dateTo !== undefined && dateType === 'apply-date-period'"
                type="date"
                class="form-control"
                v-bind:value="props.dateTo"
                v-on:change="onChangeDateTo"
                required
              />
            </div>
          </div>
        </div>
        <div class="row" v-if="props.timeFrom !== undefined">
          <div class="col-2 bg-dark text-white border border-dark">時刻</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <div class="input-group">
              <div
                v-for="(option, index) in props.applyTypeOptions2"
                class="form-check form-check-inline"
              >
                <input
                  class="form-check-input"
                  type="radio"
                  name="apply-type-option2"
                  v-bind:id="'apply-type-option2-' + option.name"
                  v-bind:value="option.name"
                  v-bind:checked="index === 0"
                  v-on:change="onChangeApplyType2"
                />
                <label
                  class="form-check-label"
                  v-bind:for="'apply-type-option2-' + option.name"
                >{{ option.description }}</label>
              </div>
              <input
                v-if="props.timeFrom !== undefined"
                v-bind:value="props.timeFrom"
                v-on:change="onChangeTimeFrom"
                type="time"
                class="form-control"
                required
              />
              <span v-if="props.timeTo !== undefined" class="input-group-text">〜</span>
              <input
                v-if="props.timeTo !== undefined"
                type="time"
                class="form-control"
                v-bind:value="props.timeTo"
                v-on:change="onChangeTimeTo"
                required
              />
            </div>
          </div>
        </div>
        <div class="row" v-if="props.reason !== undefined">
          <div class="col-2 bg-dark text-white border border-dark">理由</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <textarea
              class="form-control"
              rows="3"
              cols="32"
              v-on:change="onChangeReason"
              v-bind:required="props.applyType !== 'leave' || props.applyTypeValue1 !== 'paid'"
            ></textarea>
          </div>
        </div>
        <div class="row" v-if="props.contact !== undefined">
          <div class="col-2 bg-dark text-white border border-dark">連絡先</div>
          <div class="col-9 bg-white text-black border border-dark p-2">
            <textarea class="form-control" rows="3" cols="32" v-on:change="onChangeContact"></textarea>
          </div>
        </div>
        <div class="row g-2 mt-2">
          <div class="d-grid col gap-2">
            <input type="submit" class="btn btn-warning btn-lg" value="申請" />
          </div>
        </div>
      </form>
    </div>
  </div>
  <!--
<main>
    <TheWelcome />
  </main>
  -->
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

<style scoped>
.form-width-10 {
  width: 10%;
}
</style>