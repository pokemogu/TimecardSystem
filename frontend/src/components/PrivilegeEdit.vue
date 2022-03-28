<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';

import { useSessionStore } from '@/stores/session';

import type * as apiif from 'shared/APIInterfaces';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  privilege?: apiif.PrivilegeResponseData
}>();

const isOpened = ref(false);

/*
const editedWorkPattern = ref<{
  name: string,
  isOnTimeStartNextDay: boolean,
  onTimeStart: string,
  isOnTimeEndNextDay: boolean,
  onTimeEnd: string,
}>({
  name: props.workPattern?.name ? props.workPattern.name : '',
  isOnTimeStartNextDay: props.workPattern?.onTimeStart ? isNextDayTime(props.workPattern.onTimeStart) : false,
  onTimeStart: props.workPattern?.onTimeStart ? getNextDayTime(props.workPattern.onTimeStart) : '09:00:00',
  isOnTimeEndNextDay: props.workPattern?.onTimeEnd ? isNextDayTime(props.workPattern.onTimeEnd) : false,
  onTimeEnd: props.workPattern?.onTimeStart ? getNextDayTime(props.workPattern.onTimeEnd) : '18:00:00',
});
*/

const editedWagePatterns = ref<{
  id?: number,
  name: string,
  isTimeStartNextDay: boolean,
  timeStart: string,
  isTimeEndNextDay: boolean,
  timeEnd: string,
  normalWagePercentage: number,
  holidayWagePercentage: number
}[]>([]);

/*
if (props.workPattern?.wagePatterns) {
  for (const wagePattern of props.workPattern.wagePatterns) {
    editedWagePatterns.value.push({
      id: wagePattern.id,
      name: wagePattern.name,
      isTimeStartNextDay: isNextDayTime(wagePattern.timeStart),
      timeStart: getNextDayTime(wagePattern.timeStart),
      isTimeEndNextDay: isNextDayTime(wagePattern.timeEnd),
      timeEnd: getNextDayTime(wagePattern.timeEnd),
      normalWagePercentage: wagePattern.normalWagePercentage,
      holidayWagePercentage: wagePattern.holidayWagePercentage
    });
  }
}
*/

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:workPattern', value: apiif.WorkPatternResponseData): void,
  (event: 'submit'): void,
}>();

onMounted(async () => {
});

function onClose(event: Event) {
  emits('update:isOpened', false);
}

function onSubmit(event: Event) {

  /*
    const resultWorkPattern: apiif.WorkPatternResponseData = {
      id: props.workPattern?.id,
      name: editedWorkPattern.value.name,
      onTimeStart: addNextDayTime(editedWorkPattern.value.isOnTimeStartNextDay, editedWorkPattern.value.onTimeStart),
      onTimeEnd: addNextDayTime(editedWorkPattern.value.isOnTimeEndNextDay, editedWorkPattern.value.onTimeEnd),
      wagePatterns: editedWagePatterns.value.map(pattern => {
        return {
          id: pattern.id,
          name: pattern.name,
          timeStart: addNextDayTime(pattern.isTimeStartNextDay, pattern.timeStart),
          timeEnd: addNextDayTime(pattern.isTimeEndNextDay, pattern.timeEnd),
          normalWagePercentage: pattern.normalWagePercentage,
          holidayWagePercentage: pattern.holidayWagePercentage
        };
      })
    };
    */

  emits('update:isOpened', false);
  //emits('update:workPattern', resultWorkPattern);
  emits('submit');
}

function onAddWagePattern() {
  editedWagePatterns.value.push({
    name: '',
    isTimeStartNextDay: false,
    timeStart: '',
    isTimeEndNextDay: false,
    timeEnd: '',
    normalWagePercentage: 100,
    holidayWagePercentage: 115
  });
}

function onDeleteWagePattern(index: number) {
  editedWagePatterns.value.splice(index, 1);
}

</script>

<template>
  <div class="overlay" id="privilege-root">
    <div class="modal-dialog modal-xl vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">権限設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row justify-content-start">
              <label for="privilage-name" class="col-1 col-form-label text-end">権限名</label>
              <div class="col-3">
                <input type="text" class="form-control" id="privilage-name" required />
              </div>
            </div>
            <div class="row">
              <div class="d-flex align-content-start flex-wrap">
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">打刻でPC使用可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">打刻申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">有給申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">半休申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">代休申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">慶弔休申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">措置休申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">早出・残業申請可否</label>
                </div>
                <div class="form-check form-switch m-2">
                  <input class="form-check-input" type="checkbox" role="switch" />
                  <label class="form-check-label" for="flexSwitchCheckDefault">遅刻申請可否</label>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
            <button type="submit" class="btn btn-primary">設定</button>
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