<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '@/stores/session';
import { format, parse } from 'fecha';

import UserSelect from '@/components/UserSelect.vue';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  account?: string,
  date?: Date,
  clockin?: Date,
  stepout?: Date,
  reenter?: Date,
  clockout?: Date,
  limitDepartmentName?: string,
  limitSectionName?: string
}>();

//console.log(props);

const selectedUserAccount = ref(props.account ?? '');
const recordDate = ref(props.date ? format(props.date, 'isoDate') : '');
//recordDate.value = recordDate.value.replace(/\//g, '-');
const isNewRecord = ref(props.date ? false : true);

const recordClockin = ref(props.clockin ? format(props.clockin, 'HH:mm') : '');
const recordStepout = ref(props.stepout ? format(props.stepout, 'HH:mm') : '');
const recordReenter = ref(props.reenter ? format(props.reenter, 'HH:mm') : '');
const recordClockout = ref(props.clockout ? format(props.clockout, 'HH:mm') : '');

const isUserSelectOpened = ref(false);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:account', value: string): void,
  (event: 'update:date', value: Date): void,
  (event: 'update:clockin', value: Date): void,
  (event: 'update:stepout', value: Date): void,
  (event: 'update:reenter', value: Date): void,
  (event: 'update:clockout', value: Date): void,
  (event: 'submit'): void
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

async function onSubmit(event: Event) {
  emits('update:isOpened', false);
  emits('update:account', selectedUserAccount.value);

  let date = parse(recordDate.value, 'isoDate');
  if (date) {
    emits('update:date', date);
  }

  date = parse(recordDate.value + ' ' + recordClockin.value, 'YYYY-MM-DD HH:mm');
  if (date) {
    emits('update:clockin', date);
  }

  if (recordStepout.value !== '') {
    date = parse(recordDate.value + ' ' + recordStepout.value, 'YYYY-MM-DD HH:mm');
    if (date) {
      emits('update:stepout', date);
    }
  }
  if (recordReenter.value !== '') {
    date = parse(recordDate.value + ' ' + recordReenter.value, 'YYYY-MM-DD HH:mm');
    if (date) {
      emits('update:reenter', date);
    }
  }
  if (recordClockout.value !== '') {
    date = parse(recordDate.value + ' ' + recordClockout.value, 'YYYY-MM-DD HH:mm');
    if (date) {
      emits('update:clockout', date);
    }
  }
  emits('submit');
}

</script>

<template>
  <div class="overlay" id="record-edit-root">
    <Teleport to="#record-edit-root" v-if="isUserSelectOpened">
      <UserSelect v-model:account="selectedUserAccount" v-model:isOpened="isUserSelectOpened"
        :limitDepartmentName="props.limitDepartmentName" :limitSectionName="props.limitSectionName"></UserSelect>
    </Teleport>
    <div class="modal-dialog vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">打刻<template v-if="isNewRecord">追加</template><template v-else>修正(丸めなし実値)</template>
          </h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <div class="row">
            <div class="col">
              <div class="input-group mb-3">
                <span class="input-group-text" id="label-account">ID</span>
                <input type="text" class="form-control p-2" id="account" v-model="selectedUserAccount" required
                  readonly />
                <button class="btn btn-outline-secondary" type="button" id="button-addon2"
                  v-on:click="isUserSelectOpened = true" :disabled="isNewRecord !== true">検索</button>
              </div>
            </div>
            <div class="col">
              <div class="input-group mb-3">
                <span class="input-group-text" id="label-date">日付</span>
                <input type="date" class="form-control p-2" id="date" v-model="recordDate" required
                  :disabled="isNewRecord === false" />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="input-group mb-3">
                <span class="input-group-text" id="label-clockin">出勤</span>
                <input type="time" class="form-control p-2" id="clockinTime" v-model="recordClockin" required />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="input-group mb-3">
                <span class="input-group-text" id="label-stepout">外出</span>
                <!--
                <div class="input-group-text">
                  <input class="form-check-input mt-0" type="checkbox" id="nextday-stepout">
                  <label class="form-check-label" for="nextday-stepout">翌日</label>
                </div>
                -->
                <input type="time" class="form-control p-2" id="stepoutTime" v-model="recordStepout" />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="input-group mb-3">
                <span class="input-group-text" id="label-reenter">再入</span>
                <!--
                <div class="input-group-text">
                  <input class="form-check-input mt-0" type="checkbox" id="nextday-reenter">
                  <label class="form-check-label" for="nextday-reenter">翌日</label>
                </div>
                -->
                <input type="time" class="form-control p-2" id="reenterTime" v-model="recordReenter" />
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col">
              <div class="input-group mb-3">
                <span class="input-group-text" id="label-clockout">退勤</span>
                <!--
                <div class="input-group-text">
                  <input class="form-check-input mt-0" type="checkbox" id="nextday-clockout">
                  <label class="form-check-label" for="nextday-clockout">翌日</label>
                </div>
                -->
                <input type="time" class="form-control p-2" id="clockoutTime" v-model="recordClockout" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
            <button type="button" class="btn btn-primary"
              v-bind:disabled="selectedUserAccount === '' || recordDate === '' || recordClockin === ''"
              v-on:click="onSubmit">
              <template v-if="isNewRecord">追加</template>
              <template v-else>修正</template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: absolute;
  z-index: 998;
  top: 0;
  height: 100%;
  left: 0;
  width: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

.vue-modal {
  position: fixed;
  z-index: 997;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 20%;
  right: 20%;
}
</style>