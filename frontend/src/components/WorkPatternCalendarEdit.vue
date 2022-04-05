<script setup lang="ts">
import { ref } from 'vue';
import { useSessionStore } from '@/stores/session';

function dateToStr(date: Date) {
  return date.getFullYear() + '-' + (date.getMonth() + 1).toString().padStart(2, '0') + '-' + date.getDate().toString().padStart(2, '0');
}

const store = useSessionStore();

const props = defineProps<{
  date: Date,
  isHoliday: boolean,
  selectedWorkPatternName: string,
  workPatternNames: string[],
  isOpened: boolean
}>();

const selectedPatternName = ref(props.selectedWorkPatternName);

const emits = defineEmits<{
  (event: 'update:isOpened', value: boolean): void,
  (event: 'update:selectedWorkPatternName', value: string): void,
  (event: 'submit'): void,
}>();

function onClose(event: Event) {
  emits('update:isOpened', false);
}

async function onSubmit(event: Event) {
  emits('update:isOpened', false);
  emits('update:selectedWorkPatternName', selectedPatternName.value);
  emits('submit');
}

</script>

<template>
  <div class="overlay">
    <div class="modal-dialog vue-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">勤務体系の変更</h5>
          <button type="button" class="btn-close" v-on:click="onClose"></button>
        </div>
        <div class="modal-body">
          <p>変更する勤務体系を選択してください。</p>
          <div class="row">
            <label for="date" class="col-6 col-form-label">日付</label>
            <div class="col-6">
              <input
                type="date"
                class="form-control p-2"
                id="date"
                :value="dateToStr(props.date)"
                required
                readonly
                disabled
              />
            </div>
          </div>
          <div class="row">
            <label for="work-pattern" class="col-6 col-form-label">勤務体系</label>
            <div class="col-6">
              <select
                class="form-select p-2"
                id="work-pattern"
                v-model="selectedPatternName"
                required
              >
                <option value>勤務なし</option>
                <option v-for="(item, index) in props.workPatternNames" :value="item">{{ item }}</option>
              </select>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" v-on:click="onClose">取消</button>
          <button type="button" class="btn btn-primary" v-on:click="onSubmit">変更</button>
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
  z-index: 999;
  margin: 0 auto;
  top: 10%;
  bottom: 10%;
  left: 20%;
  right: 20%;
}
</style>