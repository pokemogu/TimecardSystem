<script setup lang="ts">
import { ref, computed, inject } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

interface ApplyFormProps {
  applyName: string,
  userName: string,
  userDepartment?: string,
  userSection?: string,
  applyTypeValue?: string,
  applyTypeOptions?: { value: string, name: string }[],
  isApplyTypeOptionsDropdown?: boolean,
  dateFrom: string,
  dateTo?: string,
  isDateToOptional?: boolean,
  timeFrom?: string,
  timeTo?: string,
  reason?: string,
  contact?: string
}

const props = defineProps<ApplyFormProps>();
const emits = defineEmits<{
  (event: 'update:applyTypeValue', value: string): void,
  (event: 'update:dateFrom', value: string): void,
  (event: 'update:dateTo', value: string): void,
  (event: 'update:timeFrom', value: string): void,
  (event: 'update:timeTo', value: string): void,
  (event: 'update:reason', value: string): void,
  (event: 'update:contact', value: string): void,
  (event: 'submit'): void
}>();

function onChangeApplyType(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:applyTypeValue', value);
}

function onChangeDateFrom(event: Event) {
  const value = (<HTMLInputElement>event.target).value;
  emits('update:dateFrom', value);
}

function onSubmit() {
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
              <p class="card-text fs-6 m-0">2022/03/05</p>
              <p class="card-title fs-6 m-0">{{ props.userName }}</p>
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
            <div class="col-9 bg-white text-black border border-dark">2022/03/06</div>
          </div>
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">所属</div>
            <div
              class="col-9 bg-white text-black border border-dark"
            >{{ props.userDepartment }} {{ props.userSection }}</div>
          </div>
          <div class="row">
            <div class="col-3 bg-dark text-white border border-dark">氏名</div>
            <div class="col-9 bg-white text-black border border-dark">{{ props.userName }}</div>
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
      <div v-if="props.applyTypeOptions" class="row">
        <div class="col-2 bg-dark text-white border border-dark">種類</div>
        <div class="col-9 bg-white text-black border border-dark">
          <div
            v-for="(option, index) in props.applyTypeOptions"
            class="form-check form-check-inline"
          >
            <input
              class="form-check-input"
              type="radio"
              name="apply-type"
              v-bind:id="'apply-type-' + option.value"
              v-bind:value="option.value"
              v-bind:checked="index === 0"
              v-on:change="onChangeApplyType"
            />
            <label
              class="form-check-label"
              v-bind:for="'apply-type-' + option.value"
            >{{ option.name }}</label>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-2 bg-dark text-white border border-dark">日付</div>
        <div class="col-9 bg-white text-black border border-dark">
          <input
            type="date"
            v-bind:value="new Date().toISOString().slice(0, 10)"
            v-on:change="onChangeDateFrom"
          />
        </div>
      </div>
      <div class="row">
        <div class="col-2 bg-dark text-white border border-dark">時刻</div>
        <div class="col-9 bg-white text-black border border-dark">
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="apply-actual"
              id="apply-actual-attend"
              value="attend"
              checked
            />
            <label class="form-check-label" for="apply-actual-attend">出勤</label>
          </div>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="apply-actual"
              id="apply-actual-leave"
              value="leave"
            />
            <label class="form-check-label" for="apply-actual-leave">退勤</label>
          </div>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="apply-actual"
              id="apply-actual-outofoffice"
              value="outofoffice"
            />
            <label class="form-check-label" for="apply-actual-outofoffice">外出</label>
          </div>
          <div class="form-check form-check-inline">
            <input
              class="form-check-input"
              type="radio"
              name="apply-actual"
              id="apply-actual-reentry"
              value="reentry"
            />
            <label class="form-check-label" for="apply-actual-reentry">再入</label>
          </div>
          <input type="time" />
        </div>
      </div>
      <div class="row">
        <div class="col-2 bg-dark text-white border border-dark">理由</div>
        <div class="col-9 bg-white text-black border border-dark">
          <textarea rows="3" cols="32"></textarea>
        </div>
      </div>
      <div class="row g-2 mt-2">
        <div class="d-grid col gap-2">
          <button type="button" class="btn btn-warning btn-lg" v-on:click="onSubmit">申請</button>
        </div>
      </div>
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