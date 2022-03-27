<script setup lang="ts">

import { ref, watch, onMounted } from 'vue';

import { useSessionStore } from '@/stores/session';

import type * as apiif from 'shared/APIInterfaces';

const store = useSessionStore();

const props = defineProps<{
  isOpened: boolean,
  workPattern?: apiif.WorkPatternResponseData
}>();

const isOpened = ref(false);

function isNextDayTime(time: string) {
  return (parseInt(time.split(':', 2)[0]) > 23);
}

function getNextDayTime(time: string) {
  const hourMin = time.split(':', 2).map(num => parseInt(num));
  hourMin[0] = hourMin[0] > 23 ? hourMin[0] - 24 : hourMin[0];
  return hourMin.map(num => num.toString().padStart(2, '0')).join(':');
}

function addNextDayTime(isNextDay: boolean, time: string) {
  const hourMin = time.split(':', 2).map(num => parseInt(num));
  hourMin[0] = isNextDay ? hourMin[0] + 24 : hourMin[0];
  return hourMin.map(num => num.toString().padStart(2, '0')).join(':');
}

function timeToMinutes(time: string) {
  const hourMin = time.split(':', 2).map(num => parseInt(num));
  if (hourMin.length > 1) {
    return (hourMin[0] * 60) + hourMin[1];
  } else {
    return 0;
  }
}

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

  // 定時時刻チェック
  if (timeToMinutes(resultWorkPattern.onTimeEnd) < timeToMinutes(resultWorkPattern.onTimeStart)) {
    alert('定時の終了時刻が開始時刻より前の時刻になっています。');
    return;
  }

  // 勤務時間帯別時刻チェック
  for (const pattern of resultWorkPattern.wagePatterns) {
    if (timeToMinutes(pattern.timeEnd) < timeToMinutes(pattern.timeStart)) {
      alert(pattern.name + 'の終了時刻が開始時刻より前の時刻になっています。');
      return;
    }
  }

  // 勤務時間帯別名称の重複チェック
  const dupeList = resultWorkPattern.wagePatterns
    .map(pattern => pattern.name)
    .filter((item, index, self) => self.indexOf(item) != index);

  if (dupeList.length > 0) {
    alert('名称が重複しています。');
    return;
  }

  emits('update:isOpened', false);
  emits('update:workPattern', resultWorkPattern);
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
  <div class="overlay" id="approval-route-root">
    <div class="modal-dialog modal-xl vue-modal">
      <form v-on:submit="onSubmit" v-on:submit.prevent>
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">勤務体系設定</h5>
            <button type="button" class="btn-close" v-on:click="onClose"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <label for="workpattern-name" class="col-2 col-form-label text-end">勤務体系名</label>
              <div class="col-3">
                <input
                  type="text"
                  class="form-control"
                  id="workpattern-name"
                  v-model="editedWorkPattern.name"
                  required
                />
              </div>
              <label for="ontime-start" class="col-1 col-form-label text-end">定時</label>
              <div class="col-6">
                <div class="input-group">
                  <select class="form-select" v-model="editedWorkPattern.isOnTimeStartNextDay">
                    <option :value="false" selected>当日</option>
                    <option :value="true">翌日</option>
                  </select>
                  <input
                    type="time"
                    class="form-control"
                    v-model="editedWorkPattern.onTimeStart"
                    required
                  />
                  <span class="input-group-text">〜</span>
                  <select class="form-select" v-model="editedWorkPattern.isOnTimeEndNextDay">
                    <option :value="false" selected>当日</option>
                    <option :value="true">翌日</option>
                  </select>
                  <input
                    type="time"
                    class="form-control"
                    v-model="editedWorkPattern.onTimeEnd"
                    required
                  />
                </div>
              </div>
            </div>
            <div class="row">
              <div class="col-12">
                <div class="overflow-auto wage-table">
                  <table class="table">
                    <thead>
                      <tr>
                        <th scope="col" style="width: 5%">削除</th>
                        <th scope="col">名称</th>
                        <th scope="col" style="width: 45%">時間帯</th>
                        <th scope="col" style="width: 15%">平日支給率</th>
                        <th scope="col" style="width: 15%">休日支給率</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(wagePattern, index) in editedWagePatterns">
                        <td>
                          <button
                            type="button"
                            class="btn btn-danger btn-sm"
                            v-on:click="onDeleteWagePattern(index)"
                          >&times;</button>
                        </td>
                        <td>
                          <input
                            type="text"
                            class="form-control"
                            v-model="wagePattern.name"
                            required
                          />
                        </td>
                        <td>
                          <div class="input-group">
                            <select class="form-select" v-model="wagePattern.isTimeStartNextDay">
                              <option :value="false" selected>当日</option>
                              <option :value="true">翌日</option>
                            </select>
                            <input
                              type="time"
                              class="form-control"
                              v-model="wagePattern.timeStart"
                              required
                            />
                            <span class="input-group-text">〜</span>
                            <select class="form-select" v-model="wagePattern.isTimeEndNextDay">
                              <option :value="false" selected>当日</option>
                              <option :value="true">翌日</option>
                            </select>
                            <input
                              type="time"
                              class="form-control"
                              v-model="wagePattern.timeEnd"
                              required
                            />
                          </div>
                        </td>
                        <td>
                          <div class="input-group">
                            <input
                              type="number"
                              min="0"
                              class="form-control"
                              v-model="wagePattern.normalWagePercentage"
                              required
                            />
                            <span class="input-group-text">%</span>
                          </div>
                        </td>
                        <td>
                          <div class="input-group">
                            <input
                              type="number"
                              min="0"
                              class="form-control"
                              v-model="wagePattern.holidayWagePercentage"
                              required
                            />
                            <span class="input-group-text">%</span>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="2">
                          <button
                            type="button"
                            class="btn btn-primary"
                            v-on:click="onAddWagePattern"
                          >追加</button>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
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
  z-index: 997;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 0%;
  right: 0%;
}

.wage-table {
  max-height: 400px;
}
</style>